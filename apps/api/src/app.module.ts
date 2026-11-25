import { Controller, Get } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Public } from './common/decorators/auth.decorators';
import { PrismaModule } from './common/prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RbacGuard } from './common/guards/rbac.guard';
import { AuthModule } from './modules/auth/auth.module';
import { AdminSettingsModule } from './modules/admin-settings/admin-settings.module';
import { LmsModule } from './modules/lms/lms.module';
import { TutoringModule } from './modules/tutoring/tutoring.module';
import { FinanceModule } from './modules/finance/finance.module';
import { PortalsModule } from './modules/portals/portals.module';
import { GovernanceModule } from './modules/governance/governance.module';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'faheem-api',
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    CommonModule,
    AuthModule,
    AdminSettingsModule,
    LmsModule,
    TutoringModule,
    FinanceModule,
    PortalsModule,
    GovernanceModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
  ],
})
export class AppModule {}
