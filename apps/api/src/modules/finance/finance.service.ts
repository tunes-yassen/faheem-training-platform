import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EarningStatus, OrderStatus, PaymentStatus, RefundStatus, WalletEntryType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { AuditService } from '../../common/audit/audit.service';
import { AdminSettingsService } from '../admin-settings/admin-settings.service';
import { AuthenticatedUser } from '../../common/decorators/auth.decorators';
import {
  CreateOrderDto,
  PaymentWebhookDto,
  RequestRefundDto,
  ReviewRefundDto,
  SettleEarningsDto,
} from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    private readonly settings: AdminSettingsService,
  ) {}

  async getWalletSummary(userId: string) {
    const entries = await this.prisma.walletLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const allEntries = await this.prisma.walletLedger.findMany({
      where: { userId },
      select: { entryType: true, amountSar: true },
    });

    let credits = 0;
    let debits = 0;
    let holds = 0;
    let releases = 0;

    for (const e of allEntries) {
      const amt = Number(e.amountSar);
      switch (e.entryType) {
        case WalletEntryType.CREDIT:
        case WalletEntryType.REFUND:
          credits += amt;
          break;
        case WalletEntryType.DEBIT:
        case WalletEntryType.SETTLEMENT:
          debits += amt;
          break;
        case WalletEntryType.HOLD:
          holds += amt;
          break;
        case WalletEntryType.RELEASE:
          releases += amt;
          break;
      }
    }

    const heldBalanceSar = Math.max(0, Number((holds - releases).toFixed(2)));
    const availableBalanceSar = Number((credits - debits - heldBalanceSar).toFixed(2));

    return {
      currency: 'SAR',
      availableBalanceSar,
      heldBalanceSar,
      entries,
    };
  }

  async createOrder(dto: CreateOrderDto, actor: AuthenticatedUser) {
    const vatSetting = await this.settings.getDecryptedValue('general.vat_rate');
    const vatRate = vatSetting ? Number(vatSetting) / 100 : 0.15;
    const subtotal = Number(dto.amountSar.toFixed(2));
    const vat = Number((subtotal * vatRate).toFixed(2));
    const total = Number((subtotal + vat).toFixed(2));
    const orderNumber = this.crypto.randomCode('ORD', 4);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: actor.id,
          type: dto.type,
          status: OrderStatus.PENDING,
          subtotalSar: subtotal,
          vatSar: vat,
          totalSar: total,
          referenceId: dto.referenceId,
        },
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: dto.provider || 'MOYASAR',
          status: PaymentStatus.INITIATED,
          amountSar: total,
        },
      });

      return {
        order,
        payment,
        checkoutUrl: `https://pay.faheem.sa/checkout/${payment.id}`,
      };
    });
  }

  /**
   * Signed payment webhook with strict HMAC-SHA256 verification and idempotency key protection.
   * Replaying the same webhook event NEVER double-credits the wallet.
   */
  async handlePaymentWebhook(dto: PaymentWebhookDto, signatureHeader?: string) {
    const dynamicSecret = await this.settings.getDecryptedValue('payment.webhook_secret');
    const secret =
      dynamicSecret ||
      this.config.get<string>('PAYMENT_WEBHOOK_SECRET') ||
      'faheem-webhook-hmac-secret-2026';

    const canonicalPayload = `${dto.idempotencyKey}:${dto.paymentId}:${dto.providerRef}:${dto.status}:${dto.amountSar}`;
    const isValid = this.crypto.verifyHmacSha256(canonicalPayload, signatureHeader || '', secret);
    if (!isValid) {
      throw new UnauthorizedException('توقيع Webhook غير صالح');
    }

    return this.prisma.$transaction(async (tx) => {
      // Idempotency check on WalletLedger AND Payment
      const existingLedger = await tx.walletLedger.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existingLedger) {
        return {
          processed: true,
          idempotentReplay: true,
          paymentId: dto.paymentId,
          ledgerEntryId: existingLedger.id,
        };
      }

      const payment = await tx.payment.findUnique({
        where: { id: dto.paymentId },
        include: { order: true },
      });
      if (!payment) {
        throw new NotFoundException('معاملة الدفع غير موجودة');
      }
      if (payment.status === PaymentStatus.CAPTURED) {
        return {
          processed: true,
          idempotentReplay: true,
          paymentId: payment.id,
        };
      }

      if (dto.status !== 'CAPTURED') {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED, providerRef: dto.providerRef, rawPayload: dto as any },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.FAILED },
        });
        return { processed: true, idempotentReplay: false, status: 'FAILED' };
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CAPTURED,
          providerRef: dto.providerRef,
          idempotencyKey: dto.idempotencyKey,
          capturedAt: new Date(),
          rawPayload: dto as any,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAID },
      });

      // Append-only CREDIT entry to WalletLedger
      const ledgerEntry = await tx.walletLedger.create({
        data: {
          userId: payment.order.userId,
          entryType: WalletEntryType.CREDIT,
          amountSar: dto.amountSar,
          idempotencyKey: dto.idempotencyKey,
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          description: `شحن/دفع ناجح للطلب ${payment.order.orderNumber}`,
        },
      });

      await this.audit.log({
        actorId: payment.order.userId,
        action: 'PAYMENT_WEBHOOK_CAPTURED',
        entityType: 'Payment',
        entityId: payment.id,
        afterData: { amountSar: dto.amountSar, idempotencyKey: dto.idempotencyKey },
      });

      return {
        processed: true,
        idempotentReplay: false,
        paymentId: payment.id,
        ledgerEntryId: ledgerEntry.id,
      };
    });
  }

  // Maker-Checker Refunds
  listRefunds() {
    return this.prisma.refund.findMany({
      include: {
        payment: { include: { order: { include: { user: { include: { profile: true } } } } } },
        requestedBy: { include: { profile: true } },
        approvedBy: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestRefund(dto: RequestRefundDto, actor: AuthenticatedUser, ipAddress?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { refunds: true },
    });
    if (!payment) throw new NotFoundException('معاملة الدفع غير موجودة');
    if (
      payment.status !== PaymentStatus.CAPTURED &&
      payment.status !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new BadRequestException('لا يمكن استرداد معاملة لم يتم تحصيلها');
    }

    const reservedOrRefunded = payment.refunds
      .filter((r) => r.status !== RefundStatus.REJECTED)
      .reduce((acc, r) => acc + Number(r.amountSar), 0);

    const remainingCapturable = Number((Number(payment.amountSar) - reservedOrRefunded).toFixed(2));
    if (dto.amountSar > remainingCapturable) {
      throw new BadRequestException(
        `مبلغ الاسترداد (${dto.amountSar}) يتجاوز صافي المبلغ القابل للاسترداد (${remainingCapturable} ر.س)`,
      );
    }

    const refund = await this.prisma.refund.create({
      data: {
        paymentId: dto.paymentId,
        amountSar: dto.amountSar,
        reason: dto.reason,
        status: RefundStatus.PENDING_APPROVAL,
        requestedById: actor.id,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'REFUND_REQUESTED',
      entityType: 'Refund',
      entityId: refund.id,
      afterData: { paymentId: dto.paymentId, amountSar: dto.amountSar },
      ipAddress,
    });

    return refund;
  }

  /**
   * Maker-Checker enforcement: approver MUST NOT be the same user who requested the refund.
   */
  async approveRefund(
    refundId: string,
    dto: ReviewRefundDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.findUnique({
        where: { id: refundId },
        include: { payment: { include: { order: true, refunds: true } } },
      });
      if (!refund) throw new NotFoundException('طلب الاسترداد غير موجود');
      if (refund.status !== RefundStatus.PENDING_APPROVAL) {
        throw new BadRequestException('طلب الاسترداد ليس في حالة انتظار الاعتماد');
      }

      // CRITICAL: Maker != Checker
      if (refund.requestedById === actor.id) {
        throw new ForbiddenException(
          'لا يمكن لنفس المستخدم إنشاء واعتماد طلب الاسترداد (ضابط Maker-Checker)',
        );
      }

      const alreadyProcessed = refund.payment.refunds
        .filter((r) => r.status === RefundStatus.PROCESSED || r.status === RefundStatus.APPROVED)
        .reduce((acc, r) => acc + Number(r.amountSar), 0);

      const maxAllowed = Number((Number(refund.payment.amountSar) - alreadyProcessed).toFixed(2));
      if (Number(refund.amountSar) > maxAllowed) {
        throw new BadRequestException('مبلغ الاسترداد يتجاوز صافي المبلغ المحصل');
      }

      const updatedRefund = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: RefundStatus.PROCESSED,
          approvedById: actor.id,
          approvalNotes: dto.approvalNotes,
          approvedAt: new Date(),
          processedAt: new Date(),
        },
      });

      const totalAfter = alreadyProcessed + Number(refund.amountSar);
      const isFullRefund = totalAfter >= Number(refund.payment.amountSar);

      await tx.payment.update({
        where: { id: refund.paymentId },
        data: {
          status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });

      // Append-only REFUND entry to WalletLedger
      await tx.walletLedger.create({
        data: {
          userId: refund.payment.order.userId,
          entryType: WalletEntryType.REFUND,
          amountSar: refund.amountSar,
          idempotencyKey: `refund:${refund.id}`,
          referenceType: 'REFUND',
          referenceId: refund.id,
          description: `استرداد معتمد للطلب ${refund.payment.order.orderNumber}`,
        },
      });

      return updatedRefund;
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'REFUND_APPROVED',
      entityType: 'Refund',
      entityId: refundId,
      afterData: { approvedById: actor.id, amountSar: result.amountSar },
      ipAddress,
    });

    return result;
  }

  async rejectRefund(
    refundId: string,
    dto: ReviewRefundDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const refund = await this.prisma.refund.findUnique({ where: { id: refundId } });
    if (!refund) throw new NotFoundException('طلب الاسترداد غير موجود');
    if (refund.requestedById === actor.id) {
      throw new ForbiddenException('لا يمكن لنفس المنشئ البت في الطلب');
    }

    const updated = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.REJECTED,
        approvedById: actor.id,
        approvalNotes: dto.approvalNotes,
        approvedAt: new Date(),
      },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'REFUND_REJECTED',
      entityType: 'Refund',
      entityId: refundId,
      ipAddress,
    });
    return updated;
  }

  // Teacher Earnings & Settlements
  getMyEarnings(actor: AuthenticatedUser) {
    return this.prisma.teacherEarning.findMany({
      where: { teacherId: actor.id },
      include: { booking: { include: { lessonRequest: { include: { subject: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAllEarnings() {
    return this.prisma.teacherEarning.findMany({
      include: { teacher: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async settleEarnings(dto: SettleEarningsDto, actor: AuthenticatedUser, ipAddress?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const earnings = await tx.teacherEarning.findMany({
        where: { id: { in: dto.earningIds }, status: { not: EarningStatus.SETTLED } },
      });
      if (earnings.length === 0) {
        throw new BadRequestException('لا توجد مستحقات غير مسوّاة ضمن المعرفات المحددة');
      }

      await tx.teacherEarning.updateMany({
        where: { id: { in: earnings.map((e) => e.id) } },
        data: {
          status: EarningStatus.SETTLED,
          settledAt: new Date(),
          settlementRef: dto.settlementRef,
        },
      });

      for (const e of earnings) {
        await tx.walletLedger.create({
          data: {
            userId: e.teacherId,
            entryType: WalletEntryType.SETTLEMENT,
            amountSar: e.netSar,
            idempotencyKey: `settlement:${e.id}`,
            referenceType: 'SETTLEMENT',
            referenceId: e.id,
            description: `تسوية مستحقات معلم (مرجع: ${dto.settlementRef})`,
          },
        });
      }

      return { settledCount: earnings.length, settlementRef: dto.settlementRef };
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'EARNINGS_SETTLED',
      entityType: 'TeacherEarning',
      afterData: result,
      ipAddress,
    });

    return result;
  }
}
