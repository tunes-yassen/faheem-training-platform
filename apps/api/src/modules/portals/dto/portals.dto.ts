import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class RequestGuardianLinkDto {
  @ApiProperty({ example: 'student@faheem.sa' })
  @IsString()
  studentIdentifier: string;

  @ApiProperty({ example: 'أب' })
  @IsString()
  relationship: string;
}

export class VerifyGuardianLinkDto {
  @ApiProperty()
  @IsString()
  verificationCode: string;

  @ApiProperty()
  @IsBoolean()
  consentAccepted: boolean;
}

export class CreateTicketDto {
  @ApiProperty({ example: 'TUTORING' })
  @IsString()
  category: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolution?: string;
}
