import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CompensationModel,
  ConversationType,
  GuardianLinkStatus,
  UserStatus,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateStaffDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'COORDINATOR' })
  @IsString()
  roleCode: string;

  @ApiPropertyOptional({ example: 'خدمة العملاء' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'أخصائي تنسيق أكاديمي' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customPermissions?: string[];
}

export class UpdateStaffDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleCode?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customPermissions?: string[];
}

export class UpdateInstructorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTutorApproved?: boolean;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: CompensationModel })
  @IsOptional()
  @IsEnum(CompensationModel)
  compensationModel?: CompensationModel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  compensationRate?: number;

  @ApiPropertyOptional({
    example: {
      canUploadMaterials: true,
      canGrade: true,
      canIssueDraftCerts: false,
      canAcceptOpenRequests: true,
    },
  })
  @IsOptional()
  @IsObject()
  instructorFlags?: Record<string, boolean>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  courseIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cohortIds?: string[];
}

export class CreateConversationDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ enum: ConversationType, default: ConversationType.CHAT })
  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contextId?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @ApiProperty()
  @IsString()
  initialMessage: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}

export class PostConversationMessageDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: ConversationType })
  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}

export class UpdateGuardianLinkStatusDto {
  @ApiProperty({ enum: [GuardianLinkStatus.VERIFIED, GuardianLinkStatus.REVOKED] })
  @IsEnum(GuardianLinkStatus)
  status: GuardianLinkStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateGuardianControlsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBudgetLimitSar?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireBookingApproval?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowSessionRecording?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyBeforeSession?: boolean;
}
