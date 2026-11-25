import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PolicyType, SettingCategory, UserStatus } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertSettingDto {
  @ApiProperty({ enum: SettingCategory })
  @IsEnum(SettingCategory)
  category: SettingCategory;

  @ApiProperty({ example: 'مفتاح Moyasar السري' })
  @IsString()
  @MinLength(2)
  labelAr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'sk_live_xxxxx' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;
}

export class BulkSettingItemDto extends UpsertSettingDto {
  @ApiProperty({ example: 'payment.moyasar.secret_key' })
  @IsString()
  @MinLength(2)
  key: string;
}

export class BulkUpsertSettingsDto {
  @ApiProperty({ type: [BulkSettingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkSettingItemDto)
  settings: BulkSettingItemDto[];
}

export class CreatePolicyDto {
  @ApiProperty({ enum: PolicyType })
  @IsEnum(PolicyType)
  type: PolicyType;

  @ApiProperty({ example: 'v2.0' })
  @IsString()
  version: string;

  @ApiProperty({ example: 'سياسة الإلغاء والاسترداد' })
  @IsString()
  titleAr: string;

  @ApiProperty()
  @IsString()
  contentAr: string;

  @ApiProperty({ example: { freeCancelHours: 24, partialRefundPct: 50 } })
  @IsObject()
  rulesJson: Record<string, any>;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertCmsPageDto {
  @ApiProperty({ example: 'about-us' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'عن منصة فهيم' })
  @IsString()
  titleAr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty()
  @IsString()
  contentAr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDesc?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'SUPPORT_AGENT' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'موظف دعم فني' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'Support Agent' })
  @IsString()
  nameEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;
}
