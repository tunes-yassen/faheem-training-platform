import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/auth.decorators';

export interface JwtPayload {
  sub: string;
  roleCode: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_ACCESS_SECRET') || 'change-me-access-secret-min-32-chars-faheem-2026',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('الحساب غير نشط أو غير موجود');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      roleCode: user.role.code,
      permissions: user.role.permissions.map((rp) => rp.permission.code),
      isTutorApproved: user.isTutorApproved,
    };
  }
}
