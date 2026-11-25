import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationType, CourseLogType, GuardianLinkStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/auth.decorators';
import {
  CreateConversationDto,
  CreateStaffDto,
  PostConversationMessageDto,
  UpdateGuardianControlsDto,
  UpdateGuardianLinkStatusDto,
  UpdateInstructorDto,
  UpdateStaffDto,
} from './dto/governance.dto';

const INTERNAL_STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'FINANCE_MAKER',
  'FINANCE_CHECKER',
  'COORDINATOR',
  'SUPPORT_AGENT',
  'TRAINING_MANAGER',
];

@Injectable()
export class GovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ============================================================================
  // 1. STAFF MANAGEMENT & DAILY REPORT
  // ============================================================================

  async listStaff() {
    return this.prisma.user.findMany({
      where: { role: { code: { in: INTERNAL_STAFF_ROLES } } },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        profile: true,
        _count: {
          select: {
            ticketsAssigned: true,
            auditLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStaff(dto: CreateStaffDto, actor: AuthenticatedUser, ipAddress?: string) {
    const role = await this.prisma.role.findUnique({ where: { code: dto.roleCode.toUpperCase() } });
    if (!role) throw new BadRequestException('الدور الوظيفي غير موجود');

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          ...(dto.phone ? [{ phone: dto.phone.trim() }] : []),
        ],
      },
    });
    if (existing) {
      throw new ConflictException('البريد الإلكتروني أو رقم الجوال مسجل مسبقاً');
    }

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        phone: dto.phone?.trim() || null,
        roleId: role.id,
        profile: {
          create: {
            fullName: dto.fullName,
            department: dto.department || 'العمليات',
            jobTitle: dto.jobTitle || role.nameAr,
            customPermissions: dto.customPermissions ?? [],
          },
        },
      },
      include: { role: true, profile: true },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'STAFF_CREATED',
      entityType: 'User',
      entityId: user.id,
      afterData: {
        email: user.email,
        roleCode: role.code,
        department: dto.department,
        customPermissions: dto.customPermissions ?? [],
      },
      ipAddress,
    });

    return user;
  }

  async updateStaff(
    staffId: string,
    dto: UpdateStaffDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: staffId },
      include: { role: true, profile: true },
    });
    if (!existing) throw new NotFoundException('الموظف غير موجود');

    let nextRoleId = existing.roleId;
    if (dto.roleCode) {
      const role = await this.prisma.role.findUnique({ where: { code: dto.roleCode.toUpperCase() } });
      if (!role) throw new BadRequestException('الدور الوظيفي غير موجود');
      nextRoleId = role.id;
    }

    const updated = await this.prisma.user.update({
      where: { id: staffId },
      data: {
        roleId: nextRoleId,
        status: dto.status ?? existing.status,
        profile: {
          upsert: {
            create: {
              fullName: existing.profile?.fullName || 'موظف فهيم',
              department: dto.department,
              jobTitle: dto.jobTitle,
              customPermissions: dto.customPermissions ?? [],
            },
            update: {
              ...(dto.department !== undefined ? { department: dto.department } : {}),
              ...(dto.jobTitle !== undefined ? { jobTitle: dto.jobTitle } : {}),
              ...(dto.customPermissions !== undefined
                ? { customPermissions: dto.customPermissions }
                : {}),
            },
          },
        },
      },
      include: { role: true, profile: true },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'STAFF_UPDATED',
      entityType: 'User',
      entityId: staffId,
      beforeData: {
        roleCode: existing.role.code,
        status: existing.status,
        department: existing.profile?.department,
        customPermissions: existing.profile?.customPermissions,
      },
      afterData: {
        roleCode: updated.role.code,
        status: updated.status,
        department: updated.profile?.department,
        customPermissions: updated.profile?.customPermissions,
      },
      ipAddress,
    });

    return updated;
  }

  async getStaffDailyReport() {
    const staffMembers = await this.prisma.user.findMany({
      where: { role: { code: { in: INTERNAL_STAFF_ROLES } } },
      include: { role: true, profile: true },
    });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [tickets, callLogs, assignments, recentAudits] = await Promise.all([
      this.prisma.ticket.findMany({ where: { assigneeId: { not: null } } }),
      this.prisma.conversationMessage.findMany({
        where: { type: ConversationType.CALL_LOG, isDeleted: false },
      }),
      this.prisma.auditLog.findMany({
        where: { action: 'LESSON_REQUEST_ASSIGNED' },
      }),
      this.prisma.auditLog.findMany({
        where: { createdAt: { gte: since } },
      }),
    ]);

    const rows = staffMembers.map((member) => {
      const assignedTickets = tickets.filter((t) => t.assigneeId === member.id);
      const closedTickets = assignedTickets.filter((t) =>
        ['RESOLVED', 'CLOSED'].includes(t.status),
      );
      const openTickets = assignedTickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status));
      const withinSla = closedTickets.filter(
        (t) => !t.resolvedAt || t.resolvedAt <= t.slaDueAt,
      ).length;
      const slaCompliancePct =
        closedTickets.length > 0 ? Math.round((withinSla / closedTickets.length) * 100) : 100;

      const callsHandled = callLogs.filter((c) => c.senderId === member.id).length;
      const requestsAssigned = assignments.filter((a) => a.actorId === member.id).length;
      const dailyAuditActions = recentAudits.filter((a) => a.actorId === member.id).length;

      return {
        staffId: member.id,
        fullName: member.profile?.fullName || member.email,
        roleCode: member.role.code,
        roleNameAr: member.role.nameAr,
        department: member.profile?.department || 'العمليات',
        callsHandled,
        ticketsClosed: closedTickets.length,
        ticketsOpen: openTickets.length,
        slaCompliancePct,
        requestsAssigned,
        dailyAuditActions,
      };
    });

    return {
      reportDate: new Date().toISOString().slice(0, 10),
      summary: {
        totalStaff: rows.length,
        totalCallsHandled: rows.reduce((s, r) => s + r.callsHandled, 0),
        totalTicketsClosed: rows.reduce((s, r) => s + r.ticketsClosed, 0),
        totalRequestsAssigned: rows.reduce((s, r) => s + r.requestsAssigned, 0),
        avgSlaCompliancePct:
          rows.length > 0
            ? Math.round(rows.reduce((s, r) => s + r.slaCompliancePct, 0) / rows.length)
            : 100,
      },
      staff: rows,
    };
  }

  // ============================================================================
  // 2. TRAINERS & TUTORS GOVERNANCE
  // ============================================================================

  async listInstructors(roleFilter?: string) {
    const targetRoles =
      roleFilter && ['TRAINER', 'TUTOR'].includes(roleFilter.toUpperCase())
        ? [roleFilter.toUpperCase()]
        : ['TRAINER', 'TUTOR'];

    const instructors = await this.prisma.user.findMany({
      where: { role: { code: { in: targetRoles } } },
      include: {
        role: true,
        profile: true,
        tutorApplication: true,
        tutorSubjects: { include: { subject: true } },
        coursesTrained: { select: { id: true, titleAr: true, deliveryMode: true, status: true } },
        cohortsTrained: { select: { id: true, code: true, titleAr: true } },
        teacherEarnings: { select: { netSar: true, status: true } },
        _count: {
          select: {
            bookingsAsTutor: true,
            coursesTrained: true,
            cohortsTrained: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return instructors.map((inst) => {
      const totalEarningsSar = inst.teacherEarnings.reduce((sum, e) => sum + Number(e.netSar), 0);
      return {
        id: inst.id,
        email: inst.email,
        phone: inst.phone,
        status: inst.status,
        roleCode: inst.role.code,
        roleNameAr: inst.role.nameAr,
        isTutorApproved: inst.isTutorApproved,
        fullName: inst.profile?.fullName || inst.email,
        bio: inst.profile?.bio,
        city: inst.profile?.city,
        ratingAvg: Number(inst.profile?.ratingAvg || 0),
        ratingCount: inst.profile?.ratingCount || 0,
        compensationModel: inst.profile?.compensationModel || 'COMMISSION',
        compensationRate: Number(inst.profile?.compensationRate ?? inst.profile?.hourlyRate ?? 75),
        instructorFlags: inst.profile?.instructorFlags ?? {
          canUploadMaterials: true,
          canGrade: true,
          canIssueDraftCerts: false,
          canAcceptOpenRequests: inst.isTutorApproved,
        },
        subjects: inst.tutorSubjects.map((ts) => ts.subject),
        courses: inst.coursesTrained,
        cohorts: inst.cohortsTrained,
        stats: {
          bookingsCount: inst._count.bookingsAsTutor,
          coursesCount: inst._count.coursesTrained,
          cohortsCount: inst._count.cohortsTrained,
          totalEarningsSar: Number(totalEarningsSar.toFixed(2)),
        },
      };
    });
  }

  async updateInstructor(
    instructorId: string,
    dto: UpdateInstructorDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: instructorId },
      include: { role: true, profile: true },
    });
    if (!existing || !['TUTOR', 'TRAINER'].includes(existing.role.code)) {
      throw new NotFoundException('المدرب أو المعلم غير موجود');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: instructorId },
        data: {
          ...(dto.isTutorApproved !== undefined ? { isTutorApproved: dto.isTutorApproved } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          profile: {
            upsert: {
              create: {
                fullName: existing.profile?.fullName || 'معلم فهيم',
                compensationModel: dto.compensationModel ?? 'COMMISSION',
                compensationRate: dto.compensationRate,
                instructorFlags: dto.instructorFlags ?? {},
              },
              update: {
                ...(dto.compensationModel !== undefined
                  ? { compensationModel: dto.compensationModel }
                  : {}),
                ...(dto.compensationRate !== undefined
                  ? { compensationRate: dto.compensationRate, hourlyRate: dto.compensationRate }
                  : {}),
                ...(dto.instructorFlags !== undefined
                  ? { instructorFlags: dto.instructorFlags }
                  : {}),
              },
            },
          },
        },
        include: { role: true, profile: true },
      });

      if (dto.subjectIds) {
        await tx.tutorSubject.deleteMany({ where: { tutorId: instructorId } });
        if (dto.subjectIds.length > 0) {
          await tx.tutorSubject.createMany({
            data: dto.subjectIds.map((subjectId) => ({ tutorId: instructorId, subjectId })),
            skipDuplicates: true,
          });
        }
      }

      if (dto.courseIds?.length) {
        await tx.course.updateMany({
          where: { id: { in: dto.courseIds } },
          data: { trainerId: instructorId },
        });
      }

      if (dto.cohortIds?.length) {
        await tx.cohort.updateMany({
          where: { id: { in: dto.cohortIds } },
          data: { trainerId: instructorId },
        });
      }

      return user;
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'INSTRUCTOR_UPDATED',
      entityType: 'User',
      entityId: instructorId,
      beforeData: {
        isTutorApproved: existing.isTutorApproved,
        status: existing.status,
        compensationModel: existing.profile?.compensationModel,
        compensationRate: existing.profile?.compensationRate,
        instructorFlags: existing.profile?.instructorFlags,
      },
      afterData: {
        isTutorApproved: updated.isTutorApproved,
        status: updated.status,
        compensationModel: updated.profile?.compensationModel,
        compensationRate: updated.profile?.compensationRate,
        instructorFlags: updated.profile?.instructorFlags,
      },
      ipAddress,
    });

    return updated;
  }

  // ============================================================================
  // 3. CONVERSATIONS & CALL LOGS
  // ============================================================================

  async listMyConversations(actor: AuthenticatedUser) {
    return this.prisma.conversationThread.findMany({
      where: {
        participants: { some: { userId: actor.id } },
      },
      include: {
        participants: {
          include: { user: { include: { profile: true, role: true } } },
        },
        messages: {
          where: { isDeleted: false },
          include: { sender: { include: { profile: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createConversation(dto: CreateConversationDto, actor: AuthenticatedUser) {
    const uniqueParticipants = Array.from(new Set([actor.id, ...dto.participantIds]));
    const type = dto.type ?? ConversationType.CHAT;

    const thread = await this.prisma.conversationThread.create({
      data: {
        title: dto.title,
        type,
        contextType: dto.contextType || 'GENERAL',
        contextId: dto.contextId,
        createdById: actor.id,
        participants: {
          create: uniqueParticipants.map((userId) => ({ userId })),
        },
        messages: {
          create: {
            senderId: actor.id,
            type,
            content: dto.initialMessage,
            durationSeconds: dto.durationSeconds,
          },
        },
      },
      include: {
        participants: { include: { user: { include: { profile: true, role: true } } } },
        messages: { include: { sender: { include: { profile: true, role: true } } } },
      },
    });

    return thread;
  }

  async postConversationMessage(
    threadId: string,
    dto: PostConversationMessageDto,
    actor: AuthenticatedUser,
  ) {
    const thread = await this.prisma.conversationThread.findUnique({
      where: { id: threadId },
      include: { participants: true },
    });
    if (!thread) throw new NotFoundException('المحادثة غير موجودة');

    const isParticipant = thread.participants.some((p) => p.userId === actor.id);
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'].includes(actor.roleCode);
    if (!isParticipant && !isStaff) {
      throw new ForbiddenException('غير مصرح لك بالإرسال في هذه المحادثة');
    }

    const message = await this.prisma.conversationMessage.create({
      data: {
        threadId,
        senderId: actor.id,
        type: dto.type ?? thread.type,
        content: dto.content,
        durationSeconds: dto.durationSeconds,
      },
      include: { sender: { include: { profile: true, role: true } } },
    });

    await this.prisma.conversationThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async adminListConversations(query: { search?: string; type?: ConversationType; status?: string }) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { messages: { some: { content: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    return this.prisma.conversationThread.findMany({
      where,
      include: {
        participants: { include: { user: { include: { profile: true, role: true } } } },
        messages: {
          where: { isDeleted: false },
          include: { sender: { include: { profile: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async superAdminDeleteMessage(
    messageId: string,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    if (actor.roleCode !== 'SUPER_ADMIN') {
      throw new ForbiddenException('حذف الرسائل متاح لمدير النظام العام (SUPER_ADMIN) فقط');
    }

    const existing = await this.prisma.conversationMessage.findUnique({
      where: { id: messageId },
    });
    if (!existing) throw new NotFoundException('الرسالة غير موجودة');

    const updated = await this.prisma.conversationMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedById: actor.id,
        deletedAt: new Date(),
      },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'CONVERSATION_MESSAGE_DELETED',
      entityType: 'ConversationMessage',
      entityId: messageId,
      beforeData: {
        threadId: existing.threadId,
        senderId: existing.senderId,
        content: existing.content,
        isDeleted: false,
      },
      afterData: {
        threadId: updated.threadId,
        isDeleted: true,
        deletedById: actor.id,
      },
      ipAddress,
    });

    return { deleted: true, id: messageId };
  }

  // ============================================================================
  // 4. COURSE EXECUTION & OPERATIONS LOGS
  // ============================================================================

  async listCourseExecutionLogs(query: {
    courseId?: string;
    logType?: CourseLogType;
    from?: string;
    to?: string;
    search?: string;
  }) {
    const where: any = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.logType) where.logType = query.logType;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    if (query.search) {
      where.OR = [
        { titleAr: { contains: query.search, mode: 'insensitive' } },
        { details: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.courseExecutionLog.findMany({
      where,
      include: {
        course: { select: { id: true, titleAr: true, slug: true, deliveryMode: true } },
        cohort: { select: { id: true, code: true, titleAr: true } },
        actor: { include: { profile: true, role: true } },
        student: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });
  }

  // ============================================================================
  // 5. EXPANDED GUARDIAN GOVERNANCE & PER-CHILD CONTROLS
  // ============================================================================

  async adminListGuardians() {
    const parents = await this.prisma.user.findMany({
      where: { role: { code: 'PARENT' } },
      include: {
        profile: true,
        consentRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
        guardianLinksAsParent: {
          include: {
            student: {
              include: {
                profile: { include: { grade: true } },
                _count: { select: { bookingsAsStudent: true, enrollments: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return parents;
  }

  async adminUpdateGuardianLinkStatus(
    linkId: string,
    dto: UpdateGuardianLinkStatusDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.guardianStudentLink.findUnique({ where: { id: linkId } });
    if (!existing) throw new NotFoundException('رابط ولي الأمر بالطالب غير موجود');

    const updated = await this.prisma.guardianStudentLink.update({
      where: { id: linkId },
      data: {
        status: dto.status,
        verifiedAt: dto.status === GuardianLinkStatus.VERIFIED ? new Date() : existing.verifiedAt,
      },
      include: {
        parent: { include: { profile: true } },
        student: { include: { profile: true } },
      },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action:
        dto.status === GuardianLinkStatus.VERIFIED
          ? 'GUARDIAN_LINK_APPROVED'
          : 'GUARDIAN_LINK_REVOKED',
      entityType: 'GuardianStudentLink',
      entityId: linkId,
      beforeData: { status: existing.status },
      afterData: { status: updated.status, reason: dto.reason },
      ipAddress,
    });

    return updated;
  }

  async updateGuardianControls(
    linkId: string,
    dto: UpdateGuardianControlsDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.guardianStudentLink.findUnique({ where: { id: linkId } });
    if (!existing) throw new NotFoundException('رابط ولي الأمر بالطالب غير موجود');

    // Horizontal IDOR protection: only the linked parent or Admin/SuperAdmin can modify controls
    if (
      existing.parentId !== actor.id &&
      !['SUPER_ADMIN', 'ADMIN'].includes(actor.roleCode)
    ) {
      throw new ForbiddenException('غير مصرح لك بتعديل ضوابط هذا الطالب');
    }

    const updated = await this.prisma.guardianStudentLink.update({
      where: { id: linkId },
      data: {
        ...(dto.monthlyBudgetLimitSar !== undefined
          ? { monthlyBudgetLimitSar: dto.monthlyBudgetLimitSar }
          : {}),
        ...(dto.requireBookingApproval !== undefined
          ? { requireBookingApproval: dto.requireBookingApproval }
          : {}),
        ...(dto.allowSessionRecording !== undefined
          ? { allowSessionRecording: dto.allowSessionRecording }
          : {}),
        ...(dto.notifyBeforeSession !== undefined
          ? { notifyBeforeSession: dto.notifyBeforeSession }
          : {}),
      },
      include: { student: { include: { profile: true } } },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'GUARDIAN_CONTROLS_UPDATED',
      entityType: 'GuardianStudentLink',
      entityId: linkId,
      beforeData: {
        monthlyBudgetLimitSar: existing.monthlyBudgetLimitSar,
        requireBookingApproval: existing.requireBookingApproval,
        allowSessionRecording: existing.allowSessionRecording,
        notifyBeforeSession: existing.notifyBeforeSession,
      },
      afterData: {
        monthlyBudgetLimitSar: updated.monthlyBudgetLimitSar,
        requireBookingApproval: updated.requireBookingApproval,
        allowSessionRecording: updated.allowSessionRecording,
        notifyBeforeSession: updated.notifyBeforeSession,
      },
      ipAddress,
    });

    return updated;
  }
}
