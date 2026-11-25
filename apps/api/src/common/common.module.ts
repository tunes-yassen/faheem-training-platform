import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit/audit.service';
import { CryptoService } from './crypto/crypto.service';

@Global()
@Module({
  providers: [AuditService, CryptoService],
  exports: [AuditService, CryptoService],
})
export class CommonModule {}
