import { Module } from '@nestjs/common';
import { TutoringController } from './tutoring.controller';
import { TutoringService } from './tutoring.service';

@Module({
  controllers: [TutoringController],
  providers: [TutoringService],
  exports: [TutoringService],
})
export class TutoringModule {}
