import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GuardianLinkStatus, TicketPriority, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/auth.decorators';
import {
  CreateTicketDto,
  RequestGuardianLinkDto,
  UpdateTicketDto,
  VerifyGuardianLinkDto,
} from './dto/portals.dto';

@Injectable()
export class PortalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
  ) {}

  async requestGuardianLink(dto: RequestGuardianLinkDto, actor: AuthenticatedUser) {
    const normalized = dto.studentIdentifier.trim().toLowerCase();
    const student = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalized }, { phone: dto.studentIdentifier.trim() }],
        role: { code: 'STUDENT' },
      },
      include: { profile: true },
    });

    if (!student) {
      throw new NotFoundException('لم يتم العثور على حساب طالب مطابق');
    }

    const verificationCode = this.crypto.randomNumericOtp(6);
    const link = await this.prisma.guardianStudentLink.upsert({
      where: { parentId_studentId: { parentId: actor.id, studentId: student.id } },
      create: {
        parentId: actor.id,
        studentId: student.id,
        relationship: dto.relationship,
        status: GuardianLinkStatus.PENDING,
        verificationCode,
      },
      update: {
        relationship: dto.relationship,
        status: GuardianLinkStatus.PENDING,
        verificationCode,
      },
      include: { student: { include: { profile: true } } },
    });

    return {
      ...link,
      message: 'تم إنشاء طلب الربط، يرجى تأكيد الرمز والموافقة على سياسة الخصوصية',
    };
  }

  async verifyGuardianLink(
    linkId: string,
    dto: VerifyGuardianLinkDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const link = await this.prisma.guardianStudentLink.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException('طلب الربط غير موجود');
    if (link.parentId !== actor.id && link.studentId !== actor.id) {
      throw new ForbiddenException('غير مصرح بتأكيد هذا الربط');
    }
    if (!dto.consentAccepted) {
      throw new BadRequestException('يجب الموافقة على إقرار ولي الأمر');
    }
    if (link.verificationCode !== dto.verificationCode) {
      throw new BadRequestException('رمز التحقق غير صحيح');
    }

    const verified = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.guardianStudentLink.update({
        where: { id: linkId },
        data: {
          status: GuardianLinkStatus.VERIFIED,
          verifiedAt: new Date(),
          verificationCode: null,
        },
        include: { student: { include: { profile: true } } },
      });

      await tx.consentRecord.create({
        data: {
          userId: actor.id,
          consentType: 'GUARDIAN_LINK',
          policyVersion: 'v1.0',
          accepted: true,
          ipAddress,
          metadata: { linkId, studentId: link.studentId },
        },
      });

      return updated;
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'GUARDIAN_LINK_VERIFIED',
      entityType: 'GuardianStudentLink',
      entityId: linkId,
      ipAddress,
    });

    return verified;
  }

  listLinkedChildren(actor: AuthenticatedUser) {
    return this.prisma.guardianStudentLink.findMany({
      where: { parentId: actor.id },
      include: {
        student: {
          include: {
            profile: { include: { grade: true } },
            bookingsAsStudent: { take: 5, orderBy: { startTime: 'desc' } },
            enrollments: { include: { cohort: { include: { course: true } } } },
          },
        },
      },
    });
  }

  // Tickets & SLA
  async createTicket(dto: CreateTicketDto, actor: AuthenticatedUser) {
    const slaHoursMap: Record<TicketPriority, number> = {
      URGENT: 4,
      HIGH: 12,
      MEDIUM: 24,
      LOW: 48,
    };
    const priority = dto.priority ?? TicketPriority.MEDIUM;
    const slaDueAt = new Date(Date.now() + slaHoursMap[priority] * 60 * 60 * 1000);

    return this.prisma.ticket.create({
      data: {
        ticketNumber: this.crypto.randomCode('TKT', 3),
        requesterId: actor.id,
        category: dto.category,
        subject: dto.subject,
        description: dto.description,
        priority,
        slaDueAt,
      },
    });
  }

  listTickets(actor: AuthenticatedUser) {
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'].includes(actor.roleCode);
    return this.prisma.ticket.findMany({
      where: isStaff ? undefined : { requesterId: actor.id },
      include: {
        requester: { include: { profile: true } },
        assignee: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTicket(id: string, dto: UpdateTicketDto, actor: AuthenticatedUser) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('التذكرة غير موجودة');

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: dto.status,
        assigneeId: dto.assigneeId,
        resolution: dto.resolution,
        resolvedAt: dto.status === TicketStatus.RESOLVED ? new Date() : undefined,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'TICKET_UPDATED',
      entityType: 'Ticket',
      entityId: id,
      afterData: { status: updated.status },
    });
    return updated;
  }

  // Notifications
  listNotifications(actor: AuthenticatedUser) {
    return this.prisma.notification.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async markNotificationRead(id: string, actor: AuthenticatedUser) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('الإشعار غير موجود');
    if (notif.userId !== actor.id) {
      throw new ForbiddenException('غير مصرح بتعديل إشعار لمستخدم آخر');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // Analytics & KPIs for Admin Dashboard
  async getAnalyticsOverview() {
    const [
      totalUsers,
      approvedTutors,
      pendingTutorApps,
      publishedCourses,
      activeEnrollments,
      totalBookings,
      openRequests,
      openTickets,
      pendingRefunds,
      capturedPayments,
      certificatesIssued,
      corporateQuotes,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isTutorApproved: true } }),
      this.prisma.tutorApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      this.prisma.booking.count(),
      this.prisma.lessonRequest.count({ where: { status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.refund.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.payment.aggregate({
        where: { status: { in: ['CAPTURED', 'PARTIALLY_REFUNDED'] } },
        _sum: { amountSar: true },
      }),
      this.prisma.certificate.count(),
      this.prisma.corporateQuoteRequest.count({ where: { status: 'NEW' } }),
    ]);

    return {
      kpis: {
        totalUsers,
        approvedTutors,
        pendingTutorApps,
        publishedCourses,
        activeEnrollments,
        totalBookings,
        openRequests,
        openTickets,
        pendingRefunds,
        grossRevenueSar: Number(capturedPayments._sum.amountSar || 0),
        certificatesIssued,
        newCorporateQuotes: corporateQuotes,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
