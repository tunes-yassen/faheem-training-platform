import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseDeliveryMode, CourseStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/auth.decorators';
import {
  CreateAssessmentDto,
  CreateCohortDto,
  CreateCorporateQuoteDto,
  CreateCourseDto,
  CreateEnrollmentDto,
  IssueCertificateDto,
  RecordAttendanceDto,
  SubmitAssessmentDto,
  UpdateCorporateQuoteDto,
} from './dto/lms.dto';

@Injectable()
export class LmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
  ) {}

  async listCourses(query: { mode?: CourseDeliveryMode; category?: string; search?: string }) {
    const where: any = { status: CourseStatus.PUBLISHED };
    if (query.mode) where.deliveryMode = query.mode;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { titleAr: { contains: query.search, mode: 'insensitive' } },
        { titleEn: { contains: query.search, mode: 'insensitive' } },
        { summaryAr: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.course.findMany({
      where,
      include: {
        trainer: { include: { profile: true } },
        cohorts: {
          where: { isActive: true },
          include: { _count: { select: { enrollments: true } } },
        },
        _count: { select: { assessments: true, materials: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCourse(id: string) {
    const course = await this.prisma.course.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        trainer: { include: { profile: true } },
        cohorts: {
          include: {
            _count: { select: { enrollments: true } },
            sessions: { orderBy: { startTime: 'asc' } },
          },
        },
        materials: true,
        assessments: true,
      },
    });
    if (!course) throw new NotFoundException('الدورة غير موجودة');
    return course;
  }

  async createCourse(dto: CreateCourseDto, actor: AuthenticatedUser, ipAddress?: string) {
    const course = await this.prisma.course.create({
      data: {
        slug: dto.slug,
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        summaryAr: dto.summaryAr,
        descriptionAr: dto.descriptionAr,
        category: dto.category,
        deliveryMode: dto.deliveryMode,
        status: dto.status ?? CourseStatus.PUBLISHED,
        priceSar: dto.priceSar,
        durationHours: dto.durationHours,
        thumbnailUrl: dto.thumbnailUrl,
        ncelAccredited: dto.ncelAccredited ?? true,
        ncelProgramCode: dto.ncelProgramCode,
        trainerId: dto.trainerId ?? actor.id,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'COURSE_CREATED',
      entityType: 'Course',
      entityId: course.id,
      afterData: course,
      ipAddress,
    });
    return course;
  }

  async updateCourse(
    id: string,
    dto: Partial<CreateCourseDto>,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('الدورة غير موجودة');
    if (actor.roleCode === 'TRAINER' && existing.trainerId !== actor.id) {
      throw new ForbiddenException('لا يمكنك تعديل دورة لا تتبعك');
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'COURSE_UPDATED',
      entityType: 'Course',
      entityId: id,
      beforeData: existing,
      afterData: updated,
      ipAddress,
    });
    return updated;
  }

  async createCohort(dto: CreateCohortDto, actor: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('الدورة غير موجودة');

    return this.prisma.cohort.create({
      data: {
        courseId: dto.courseId,
        trainerId: dto.trainerId ?? course.trainerId,
        code: dto.code,
        titleAr: dto.titleAr,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        capacity: dto.capacity ?? 30,
        location: dto.location,
      },
    });
  }

  async enroll(dto: CreateEnrollmentDto, actor: AuthenticatedUser, ipAddress?: string) {
    let targetStudentId = actor.id;
    if (dto.studentId && dto.studentId !== actor.id) {
      if (actor.roleCode === 'PARENT') {
        const link = await this.prisma.guardianStudentLink.findFirst({
          where: { parentId: actor.id, studentId: dto.studentId, status: 'VERIFIED' },
        });
        if (!link) {
          throw new ForbiddenException('لا يوجد ربط موثق بين ولي الأمر وهذا الطالب');
        }
        targetStudentId = dto.studentId;
      } else if (['SUPER_ADMIN', 'ADMIN'].includes(actor.roleCode)) {
        targetStudentId = dto.studentId;
      } else {
        throw new ForbiddenException('غير مصرح بتسجيل طالب آخر');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const cohort = await tx.cohort.findUnique({
        where: { id: dto.cohortId },
        include: { course: true, _count: { select: { enrollments: true } } },
      });
      if (!cohort || !cohort.isActive) {
        throw new NotFoundException('الشعبة التدريبية غير موجودة أو غير متاحة');
      }

      const existing = await tx.enrollment.findUnique({
        where: { cohortId_studentId: { cohortId: dto.cohortId, studentId: targetStudentId } },
      });
      if (existing && existing.status !== 'CANCELLED') {
        throw new ConflictException('الطالب مسجل مسبقاً في هذه الشعبة (منع تكرار المقعد المدفوع)');
      }

      if (cohort._count.enrollments >= cohort.capacity) {
        throw new BadRequestException('اكتمل العدد الاستيعابي لهذه الشعبة');
      }

      const enrollment = await tx.enrollment.create({
        data: {
          cohortId: dto.cohortId,
          studentId: targetStudentId,
          status: 'ACTIVE',
          paidAmountSar: cohort.course.priceSar,
        },
        include: { cohort: { include: { course: true } } },
      });

      await this.audit.log({
        actorId: actor.id,
        actorRole: actor.roleCode,
        action: 'COHORT_ENROLLED',
        entityType: 'Enrollment',
        entityId: enrollment.id,
        afterData: { cohortId: dto.cohortId, studentId: targetStudentId },
        ipAddress,
      });

      return enrollment;
    });
  }

  async getMyEnrollments(actor: AuthenticatedUser) {
    let studentIds = [actor.id];
    if (actor.roleCode === 'PARENT') {
      const links = await this.prisma.guardianStudentLink.findMany({
        where: { parentId: actor.id, status: 'VERIFIED' },
      });
      studentIds = links.map((l) => l.studentId);
    }

    return this.prisma.enrollment.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: { include: { profile: true } },
        cohort: { include: { course: true, trainer: { include: { profile: true } } } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async recordAttendance(dto: RecordAttendanceDto, actor: AuthenticatedUser) {
    return this.prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId: dto.sessionId, studentId: dto.studentId } },
      create: {
        sessionId: dto.sessionId,
        studentId: dto.studentId,
        status: dto.status,
        notes: dto.notes,
        joinedAt: dto.status === 'PRESENT' || dto.status === 'LATE' ? new Date() : null,
      },
      update: {
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async createAssessment(dto: CreateAssessmentDto) {
    return this.prisma.assessment.create({
      data: {
        courseId: dto.courseId,
        titleAr: dto.titleAr,
        description: dto.description,
        passingScore: dto.passingScore ?? 70,
        questions: dto.questions ?? [],
      },
    });
  }

  async submitAssessment(assessmentId: string, dto: SubmitAssessmentDto, actor: AuthenticatedUser) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('الاختبار غير موجود');

    const passed = dto.score >= assessment.passingScore;
    return this.prisma.assessmentSubmission.create({
      data: {
        assessmentId,
        studentId: actor.id,
        score: dto.score,
        passed,
        answers: dto.answers ?? {},
      },
    });
  }

  async issueCertificate(dto: IssueCertificateDto, actor: AuthenticatedUser, ipAddress?: string) {
    const [student, course] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.studentId }, include: { profile: true } }),
      this.prisma.course.findUnique({ where: { id: dto.courseId } }),
    ]);
    if (!student || !course) throw new NotFoundException('الطالب أو الدورة غير موجودة');

    const existing = await this.prisma.certificate.findUnique({
      where: { studentId_courseId: { studentId: dto.studentId, courseId: dto.courseId } },
    });
    if (existing) return existing;

    const serialNumber = this.crypto.randomCode('FAHEEM-CERT', 4);
    const verificationCode = this.crypto.randomCode('VER', 5);

    const cert = await this.prisma.certificate.create({
      data: {
        serialNumber,
        verificationCode,
        studentId: dto.studentId,
        courseId: dto.courseId,
        ncelAccredited: course.ncelAccredited,
        ncelReference: dto.ncelReference ?? course.ncelProgramCode,
        metadata: {
          issuedBy: actor.id,
          durationHours: course.durationHours,
          deliveryMode: course.deliveryMode,
        },
      },
      include: { course: true, student: { include: { profile: true } } },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'CERTIFICATE_ISSUED',
      entityType: 'Certificate',
      entityId: cert.id,
      afterData: { serialNumber, verificationCode, studentId: dto.studentId, courseId: dto.courseId },
      ipAddress,
    });

    return cert;
  }

  async getMyCertificates(actor: AuthenticatedUser) {
    let studentIds = [actor.id];
    if (actor.roleCode === 'PARENT') {
      const links = await this.prisma.guardianStudentLink.findMany({
        where: { parentId: actor.id, status: 'VERIFIED' },
      });
      studentIds = links.map((l) => l.studentId);
    }

    return this.prisma.certificate.findMany({
      where: { studentId: { in: studentIds } },
      include: { course: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  // PUBLIC minimal non-sensitive verification endpoint
  async verifyCertificate(code: string) {
    const cert = await this.prisma.certificate.findFirst({
      where: { OR: [{ verificationCode: code }, { serialNumber: code }] },
      include: {
        student: { include: { profile: true } },
        course: true,
      },
    });

    if (!cert) {
      throw new NotFoundException('لم يتم العثور على شهادة مطابقة لهذا الرمز');
    }

    // Minimal non-sensitive public data only (no email, phone, nationalId, userId)
    return {
      valid: cert.status === 'ACTIVE',
      status: cert.status,
      serialNumber: cert.serialNumber,
      verificationCode: cert.verificationCode,
      learnerName: cert.student.profile?.fullName ?? 'متدرب',
      courseTitleAr: cert.course.titleAr,
      courseTitleEn: cert.course.titleEn,
      durationHours: cert.course.durationHours,
      deliveryMode: cert.course.deliveryMode,
      issuedAt: cert.issuedAt,
      ncelAccredited: cert.ncelAccredited,
      ncelReference: cert.ncelReference,
    };
  }

  // Corporate B2B Quote Requests
  async createCorporateQuote(dto: CreateCorporateQuoteDto) {
    return this.prisma.corporateQuoteRequest.create({ data: dto });
  }

  async listCorporateQuotes() {
    return this.prisma.corporateQuoteRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateCorporateQuote(id: string, dto: UpdateCorporateQuoteDto, actor: AuthenticatedUser) {
    const existing = await this.prisma.corporateQuoteRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('الطلب غير موجود');
    const updated = await this.prisma.corporateQuoteRequest.update({ where: { id }, data: dto });
    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'CORPORATE_QUOTE_UPDATED',
      entityType: 'CorporateQuoteRequest',
      entityId: id,
      beforeData: { status: existing.status },
      afterData: { status: updated.status },
    });
    return updated;
  }
}
