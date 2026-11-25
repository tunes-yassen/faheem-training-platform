import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpChannel } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { AuditService } from '../../common/audit/audit.service';
import { RefreshTokenDto, RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
  ) {}

  private normalizeIdentifier(identifier: string): { normalized: string; isEmail: boolean } {
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    return {
      normalized: isEmail ? trimmed.toLowerCase() : trimmed.replace(/\s+/g, ''),
      isEmail,
    };
  }

  async requestOtp(dto: RequestOtpDto, ipAddress?: string) {
    const { normalized, isEmail } = this.normalizeIdentifier(dto.identifier);
    const channel = dto.channel ?? (isEmail ? OtpChannel.EMAIL : OtpChannel.SMS);

    // Check active lockout for brute-force protection
    const latestOtp = await this.prisma.otpCode.findFirst({
      where: { identifier: normalized },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp?.lockedUntil && latestOtp.lockedUntil > new Date()) {
      throw new HttpException(
        'تم تجاوز الحد المسموح للمحاولات. يرجى المحاولة لاحقاً.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const ttlSeconds = Number(this.config.get('OTP_TTL_SECONDS') || 300);
    const maxAttempts = Number(this.config.get('OTP_MAX_ATTEMPTS') || 5);
    const rawCode = this.crypto.randomNumericOtp(6);
    const codeHash = this.crypto.sha256(`${normalized}:${rawCode}`);

    await this.prisma.otpCode.create({
      data: {
        identifier: normalized,
        channel,
        codeHash,
        maxAttempts,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });

    await this.audit.log({
      action: 'OTP_REQUESTED',
      entityType: 'OtpCode',
      afterData: { identifier: normalized, channel },
      ipAddress,
    });

    const devEcho =
      this.config.get<string>('OTP_DEV_ECHO') === 'true' ||
      this.config.get<string>('NODE_ENV') !== 'production';

    return {
      message: 'تم إرسال رمز التحقق بنجاح',
      channel,
      expiresInSeconds: ttlSeconds,
      ...(devEcho ? { devOtp: rawCode } : {}),
    };
  }

  async verifyOtp(dto: VerifyOtpDto, ipAddress?: string) {
    const { normalized, isEmail } = this.normalizeIdentifier(dto.identifier);
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: { identifier: normalized, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('رمز التحقق غير صالح أو غير موجود');
    }

    if (otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
      throw new HttpException(
        'تم قفل التحقق مؤقتاً بسبب تكرار المحاولات الخاطئة',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد');
    }

    const expectedHash = this.crypto.sha256(`${normalized}:${dto.code}`);
    if (otpRecord.codeHash !== expectedHash) {
      const nextAttempts = otpRecord.attempts + 1;
      const lockoutMins = Number(this.config.get('OTP_LOCKOUT_MINUTES') || 15);
      const shouldLock = nextAttempts >= otpRecord.maxAttempts;

      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: {
          attempts: nextAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + lockoutMins * 60 * 1000) : null,
        },
      });

      if (shouldLock) {
        throw new HttpException(
          'تم تجاوز الحد الأقصى لمحاولات التحقق. تم القفل مؤقتاً.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new UnauthorizedException(
        `رمز التحقق غير صحيح (المتبقي ${otpRecord.maxAttempts - nextAttempts} محاولات)`,
      );
    }

    // Mark OTP as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // Find or register user
    let user = await this.prisma.user.findFirst({
      where: isEmail ? { email: normalized } : { phone: normalized },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        profile: true,
      },
    });

    if (!user) {
      const targetRoleCode = dto.roleCode || 'STUDENT';
      const role = await this.prisma.role.findUnique({ where: { code: targetRoleCode } });
      if (!role) {
        throw new BadRequestException('الدور المطلوب غير موجود');
      }

      user = await this.prisma.user.create({
        data: {
          email: isEmail ? normalized : null,
          phone: isEmail ? null : normalized,
          roleId: role.id,
          isTutorApproved: false,
          profile: {
            create: {
              fullName: dto.fullName || 'مستخدم فهيم جديد',
            },
          },
        },
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
          profile: true,
        },
      });
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('تم إيقاف هذا الحساب. يرجى التواصل مع الإدارة.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.role.code);

    await this.audit.log({
      actorId: user.id,
      actorRole: user.role.code,
      action: 'AUTH_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        roleCode: user.role.code,
        roleNameAr: user.role.nameAr,
        isTutorApproved: user.isTutorApproved,
        fullName: user.profile?.fullName ?? null,
        permissions: user.role.permissions.map((rp) => rp.permission.code),
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const tokenHash = this.crypto.sha256(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('رمز التحديث غير صالح أو منتهي الصلاحية');
    }

    if (stored.user.status === 'SUSPENDED') {
      throw new ForbiddenException('الحساب موقوف');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user.id, stored.user.role.code);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.crypto.sha256(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        profile: { include: { grade: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roleCode: user.role.code,
      roleNameAr: user.role.nameAr,
      isTutorApproved: user.isTutorApproved,
      profile: user.profile,
      permissions: user.role.permissions.map((rp) => rp.permission.code),
    };
  }

  private async issueTokens(userId: string, roleCode: string) {
    const accessSecret =
      this.config.get<string>('JWT_ACCESS_SECRET') ||
      'change-me-access-secret-min-32-chars-faheem-2026';
    const refreshSecret =
      this.config.get<string>('JWT_REFRESH_SECRET') ||
      'change-me-refresh-secret-min-32-chars-faheem-2026';

    const payload = { sub: userId, roleCode, jti: this.crypto.randomCode('jti', 8) };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, roleCode, jti: this.crypto.randomCode('rjt', 8) },
      {
        secret: refreshSecret,
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.crypto.sha256(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
