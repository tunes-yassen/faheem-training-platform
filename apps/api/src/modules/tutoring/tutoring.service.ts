import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, LessonRequestMode, Prisma, TutorApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/auth.decorators';
import {
  AssignTutorDto,
  CreateLessonRequestDto,
  ReviewTutorApplicationDto,
  SubmitEvaluationDto,
  SubmitLessonReportDto,
  SubmitTutorApplicationDto,
  UpdateAvailabilityDto,
} from './dto/tutoring.dto';

@Injectable()
export class TutoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listSubjects() {
    return this.prisma.subject.findMany({ where: { isActive: true }, orderBy: { nameAr: 'asc' } });
  }

  listGrades() {
    return this.prisma.grade.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  listPackages() {
    return this.prisma.tutoringPackage.findMany({
      where: { isActive: true },
      include: { subject: true },
      orderBy: { priceSar: 'asc' },
    });
  }

  listApprovedTutors(subjectId?: string) {
    return this.prisma.user.findMany({
      where: {
        isTutorApproved: true,
        status: 'ACTIVE',
        role: { code: 'TUTOR' },
        ...(subjectId ? { tutorSubjects: { some: { subjectId } } } : {}),
      },
      include: {
        profile: true,
        qualifications: true,
        tutorSubjects: { include: { subject: true } },
        availabilities: { where: { isActive: true } },
      },
    });
  }

  async submitApplication(dto: SubmitTutorApplicationDto, actor: AuthenticatedUser) {
    const app = await this.prisma.tutorApplication.upsert({
      where: { userId: actor.id },
      create: {
        userId: actor.id,
        bio: dto.bio,
        yearsExperience: dto.yearsExperience,
        cvUrl: dto.cvUrl,
        idDocumentUrl: dto.idDocumentUrl,
        status: TutorApplicationStatus.PENDING,
      },
      update: {
        bio: dto.bio,
        yearsExperience: dto.yearsExperience,
        cvUrl: dto.cvUrl,
        idDocumentUrl: dto.idDocumentUrl,
        status: TutorApplicationStatus.PENDING,
      },
    });

    if (dto.subjectIds?.length) {
      await this.prisma.tutorSubject.createMany({
        data: dto.subjectIds.map((subjectId) => ({ tutorId: actor.id, subjectId })),
        skipDuplicates: true,
      });
    }

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'TUTOR_APPLICATION_SUBMITTED',
      entityType: 'TutorApplication',
      entityId: app.id,
    });

    return app;
  }

  listApplications(status?: TutorApplicationStatus) {
    return this.prisma.tutorApplication.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          include: {
            profile: true,
            qualifications: true,
            tutorSubjects: { include: { subject: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewApplication(
    id: string,
    dto: ReviewTutorApplicationDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.tutorApplication.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('طلب المعلم غير موجود');

    const approved = dto.status === TutorApplicationStatus.APPROVED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.tutorApplication.update({
        where: { id },
        data: {
          status: dto.status,
          reviewNotes: dto.reviewNotes,
          reviewedById: actor.id,
          reviewedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: existing.userId },
        data: { isTutorApproved: approved },
      });

      return app;
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: approved ? 'TUTOR_APPROVED' : 'TUTOR_REJECTED',
      entityType: 'TutorApplication',
      entityId: id,
      afterData: { status: dto.status, tutorUserId: existing.userId },
      ipAddress,
    });

    return updated;
  }

  getMyAvailability(actor: AuthenticatedUser) {
    return this.prisma.availability.findMany({
      where: { tutorId: actor.id, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateAvailability(dto: UpdateAvailabilityDto, actor: AuthenticatedUser) {
    if (!actor.isTutorApproved && !['ADMIN', 'SUPER_ADMIN'].includes(actor.roleCode)) {
      throw new ForbiddenException('يجب اعتماد حساب المعلم قبل تحديد أوقات التفرغ');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ where: { tutorId: actor.id } });
      if (dto.slots.length > 0) {
        await tx.availability.createMany({
          data: dto.slots.map((s) => ({
            tutorId: actor.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      }
      return tx.availability.findMany({ where: { tutorId: actor.id } });
    });
  }

  async createLessonRequest(
    dto: CreateLessonRequestDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const start = new Date(dto.scheduledStart);
    const end = new Date(dto.scheduledEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      throw new BadRequestException('وقت نهاية الدرس يجب أن يكون بعد وقت البداية');
    }

    let studentId = actor.id;
    if (actor.roleCode === 'PARENT') {
      if (!dto.studentId) {
        throw new BadRequestException('يرجى تحديد الابن/الطالب المرتبط بحسابك');
      }
      const link = await this.prisma.guardianStudentLink.findFirst({
        where: { parentId: actor.id, studentId: dto.studentId, status: 'VERIFIED' },
      });
      if (!link) {
        throw new ForbiddenException('لا يوجد ربط موثق بين ولي الأمر وهذا الطالب');
      }
      studentId = dto.studentId;
    } else if (dto.studentId && dto.studentId !== actor.id) {
      if (!['ADMIN', 'SUPER_ADMIN', 'COORDINATOR'].includes(actor.roleCode)) {
        throw new ForbiddenException('لا يمكنك إنشاء طلب درس لطالب آخر');
      }
      studentId = dto.studentId;
    }

    if (dto.mode === LessonRequestMode.DIRECT) {
      if (!dto.preferredTutorId) {
        throw new BadRequestException('يجب اختيار المعلم في مسار الحجز المباشر');
      }
      const tutor = await this.prisma.user.findUnique({ where: { id: dto.preferredTutorId } });
      if (!tutor || !tutor.isTutorApproved) {
        throw new BadRequestException('المعلم المختار غير معتمد أو غير متاح');
      }
    }

    const request = await this.prisma.lessonRequest.create({
      data: {
        studentId,
        createdById: actor.id,
        subjectId: dto.subjectId,
        gradeId: dto.gradeId,
        mode: dto.mode,
        preferredTutorId: dto.mode === LessonRequestMode.DIRECT ? dto.preferredTutorId : null,
        scheduledStart: start,
        scheduledEnd: end,
        priceSar: dto.priceSar ?? 120,
        notes: dto.notes,
      },
      include: {
        subject: true,
        grade: true,
        student: { include: { profile: true } },
        preferredTutor: { include: { profile: true } },
      },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'LESSON_REQUEST_CREATED',
      entityType: 'LessonRequest',
      entityId: request.id,
      afterData: { mode: dto.mode, studentId, subjectId: dto.subjectId },
      ipAddress,
    });

    return request;
  }

  async listLessonRequests(actor: AuthenticatedUser) {
    if (actor.roleCode === 'TUTOR') {
      if (!actor.isTutorApproved) {
        throw new ForbiddenException('حساب المعلم قيد المراجعة ولا يمكنه استعراض الطلبات قبل الاعتماد');
      }
      return this.prisma.lessonRequest.findMany({
        where: {
          OR: [
            { status: 'OPEN', mode: LessonRequestMode.OPEN_AUTO_MATCH },
            { status: 'OPEN', mode: LessonRequestMode.DIRECT, preferredTutorId: actor.id },
            { assignedTutorId: actor.id },
          ],
        },
        include: {
          subject: true,
          grade: true,
          student: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (actor.roleCode === 'STUDENT') {
      return this.prisma.lessonRequest.findMany({
        where: { studentId: actor.id },
        include: {
          subject: true,
          grade: true,
          assignedTutor: { include: { profile: true } },
          booking: { include: { session: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (actor.roleCode === 'PARENT') {
      const links = await this.prisma.guardianStudentLink.findMany({
        where: { parentId: actor.id, status: 'VERIFIED' },
      });
      const studentIds = links.map((l) => l.studentId);
      return this.prisma.lessonRequest.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          subject: true,
          grade: true,
          student: { include: { profile: true } },
          assignedTutor: { include: { profile: true } },
          booking: { include: { session: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Admin / Coordinator
    return this.prisma.lessonRequest.findMany({
      include: {
        subject: true,
        grade: true,
        student: { include: { profile: true } },
        preferredTutor: { include: { profile: true } },
        assignedTutor: { include: { profile: true } },
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * CRITICAL: Atomic acceptance of a LessonRequest.
   * Uses a serializable/atomic DB transaction with conditional updateMany + booking overlap check
   * so concurrent accepts only ever assign ONE tutor and cleanly reject all others with 409 Conflict.
   */
  async acceptLessonRequest(requestId: string, actor: AuthenticatedUser, ipAddress?: string) {
    if (actor.roleCode !== 'TUTOR' || !actor.isTutorApproved) {
      throw new ForbiddenException('فقط المعلمون المعتمدون يمكنهم قبول طلبات الدروس');
    }

    return this.assignTutorAtomically(requestId, actor.id, actor, ipAddress, false);
  }

  async coordinatorAssignTutor(
    requestId: string,
    dto: AssignTutorDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const tutor = await this.prisma.user.findUnique({ where: { id: dto.tutorId } });
    if (!tutor || !tutor.isTutorApproved) {
      throw new BadRequestException('المعلم المختار غير معتمد');
    }
    return this.assignTutorAtomically(requestId, dto.tutorId, actor, ipAddress, true);
  }

  private async assignTutorAtomically(
    requestId: string,
    tutorId: string,
    actor: AuthenticatedUser,
    ipAddress: string | undefined,
    isCoordinatorOverride: boolean,
  ) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const req = await tx.lessonRequest.findUnique({
          where: { id: requestId },
          include: { subject: true },
        });
        if (!req) {
          throw new NotFoundException('طلب الدرس غير موجود');
        }
        if (req.status !== 'OPEN') {
          throw new ConflictException('تم قبول هذا الطلب مسبقاً أو لم يعد متاحاً');
        }
        if (!isCoordinatorOverride) {
          if (req.mode === LessonRequestMode.COORDINATOR) {
            throw new ForbiddenException('هذا الطلب مخصص للتنسيق عبر المنسق الأكاديمي');
          }
          if (req.mode === LessonRequestMode.DIRECT && req.preferredTutorId !== tutorId) {
            throw new ForbiddenException('هذا الطلب المباشر موجه لمعلم آخر');
          }
        }

        // Prevent booking time overlap for tutor or student
        const overlappingBooking = await tx.booking.findFirst({
          where: {
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
            OR: [{ tutorId }, { studentId: req.studentId }],
            AND: [
              { startTime: { lt: req.scheduledEnd } },
              { endTime: { gt: req.scheduledStart } },
            ],
          },
        });
        if (overlappingBooking) {
          throw new ConflictException('يوجد تعارض في الجدول الزمني مع حجز آخر مؤكد');
        }

        // ATOMIC conditional claim: PostgreSQL row lock ensures only 1 concurrent caller gets count === 1
        const claimed = await tx.lessonRequest.updateMany({
          where: {
            id: requestId,
            status: 'OPEN',
            assignedTutorId: null,
          },
          data: {
            status: 'BOOKED',
            assignedTutorId: tutorId,
            version: { increment: 1 },
          },
        });

        if (claimed.count === 0) {
          throw new ConflictException('تم قبول هذا الطلب مسبقاً من معلم آخر');
        }

        await tx.match.upsert({
          where: { lessonRequestId_tutorId: { lessonRequestId: requestId, tutorId } },
          create: {
            lessonRequestId: requestId,
            tutorId,
            status: 'ACCEPTED',
            respondedAt: new Date(),
          },
          update: {
            status: 'ACCEPTED',
            respondedAt: new Date(),
          },
        });

        const booking = await tx.booking.create({
          data: {
            lessonRequestId: requestId,
            studentId: req.studentId,
            tutorId,
            status: BookingStatus.CONFIRMED,
            startTime: req.scheduledStart,
            endTime: req.scheduledEnd,
            priceSar: req.priceSar,
          },
        });

        const session = await tx.session.create({
          data: {
            bookingId: booking.id,
            title: `درس ${req.subject.nameAr}`,
            startTime: req.scheduledStart,
            endTime: req.scheduledEnd,
            classroomType: 'ZOOM',
            classroomUrl: `https://classroom.faheem.sa/live/${booking.id}`,
          },
        });

        const gross = Number(req.priceSar);
        const platformFee = Number((gross * 0.25).toFixed(2));
        const net = Number((gross - platformFee).toFixed(2));

        await tx.teacherEarning.create({
          data: {
            teacherId: tutorId,
            bookingId: booking.id,
            grossSar: gross,
            platformFeeSar: platformFee,
            netSar: net,
            status: 'ACCRUED',
          },
        });

        return { booking, session };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: isCoordinatorOverride ? 'LESSON_REQUEST_ASSIGNED' : 'LESSON_REQUEST_ACCEPTED',
      entityType: 'LessonRequest',
      entityId: requestId,
      afterData: { tutorId, bookingId: result.booking.id },
      ipAddress,
    });

    return result;
  }

  async getMyBookings(actor: AuthenticatedUser) {
    if (actor.roleCode === 'TUTOR') {
      return this.prisma.booking.findMany({
        where: { tutorId: actor.id },
        include: {
          student: { include: { profile: true } },
          lessonRequest: { include: { subject: true, grade: true } },
          session: { include: { lessonReport: true } },
        },
        orderBy: { startTime: 'desc' },
      });
    }

    let studentIds = [actor.id];
    if (actor.roleCode === 'PARENT') {
      const links = await this.prisma.guardianStudentLink.findMany({
        where: { parentId: actor.id, status: 'VERIFIED' },
      });
      studentIds = links.map((l) => l.studentId);
    }

    return this.prisma.booking.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        tutor: { include: { profile: true } },
        student: { include: { profile: true } },
        lessonRequest: { include: { subject: true, grade: true } },
        session: { include: { lessonReport: true, evaluations: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async getSessionSecure(sessionId: string, actor: AuthenticatedUser) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        booking: {
          include: {
            student: { include: { profile: true } },
            tutor: { include: { profile: true } },
          },
        },
        lessonReport: true,
        evaluations: true,
      },
    });
    if (!session) throw new NotFoundException('الجلسة غير موجودة');

    // Horizontal access control (IDOR protection)
    if (!['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'].includes(actor.roleCode)) {
      const booking = session.booking;
      if (booking) {
        const isParticipant = booking.studentId === actor.id || booking.tutorId === actor.id;
        let isVerifiedParent = false;
        if (actor.roleCode === 'PARENT') {
          const link = await this.prisma.guardianStudentLink.findFirst({
            where: { parentId: actor.id, studentId: booking.studentId, status: 'VERIFIED' },
          });
          isVerifiedParent = Boolean(link);
        }
        if (!isParticipant && !isVerifiedParent) {
          throw new ForbiddenException('غير مصرح لك بالوصول إلى بيانات هذه الجلسة');
        }
      }
    }

    return session;
  }

  async submitLessonReport(
    sessionId: string,
    dto: SubmitLessonReportDto,
    actor: AuthenticatedUser,
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { booking: true },
    });
    if (!session || !session.booking) throw new NotFoundException('الجلسة غير موجودة');
    if (session.booking.tutorId !== actor.id && !['ADMIN', 'SUPER_ADMIN'].includes(actor.roleCode)) {
      throw new ForbiddenException('فقط معلم الجلسة يمكنه رفع التقرير');
    }

    const report = await this.prisma.lessonReport.upsert({
      where: { sessionId },
      create: {
        sessionId,
        tutorId: session.booking.tutorId,
        summary: dto.summary,
        strengths: dto.strengths,
        homework: dto.homework,
        progressScore: dto.progressScore,
      },
      update: {
        summary: dto.summary,
        strengths: dto.strengths,
        homework: dto.homework,
        progressScore: dto.progressScore,
      },
    });

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });

    return report;
  }

  async submitEvaluation(
    sessionId: string,
    dto: SubmitEvaluationDto,
    actor: AuthenticatedUser,
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { booking: true },
    });
    if (!session || !session.booking) throw new NotFoundException('الجلسة غير موجودة');

    let allowed = session.booking.studentId === actor.id;
    if (!allowed && actor.roleCode === 'PARENT') {
      const link = await this.prisma.guardianStudentLink.findFirst({
        where: { parentId: actor.id, studentId: session.booking.studentId, status: 'VERIFIED' },
      });
      allowed = Boolean(link);
    }
    if (!allowed) {
      throw new ForbiddenException('غير مصرح بتقييم هذه الجلسة');
    }

    return this.prisma.evaluation.create({
      data: {
        sessionId,
        evaluatorId: actor.id,
        targetId: session.booking.tutorId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }
}
