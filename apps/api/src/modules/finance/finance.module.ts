import { Module } from '@nestjs/common';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [AdminSettingsModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
