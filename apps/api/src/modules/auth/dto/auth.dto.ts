import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { OtpChannel } from '@prisma/client';

export class RequestOtpDto {
  @ApiProperty({ example: 'student@faheem.sa', description: 'Email or phone number (+9665...)' })
  @IsString()
  @MinLength(4)
  identifier: string;

  @ApiPropertyOptional({ enum: OtpChannel, default: OtpChannel.EMAIL })
  @IsOptional()
  @IsEnum(OtpChannel)
  channel?: OtpChannel;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'student@faheem.sa' })
  @IsString()
  @MinLength(4)
  identifier: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 8)
  code: string;

  @ApiPropertyOptional({
    enum: ['STUDENT', 'PARENT', 'TUTOR', 'TRAINER'],
    description: 'Role for newly registered users only (privileged roles cannot self-register)',
  })
  @IsOptional()
  @IsIn(['STUDENT', 'PARENT', 'TUTOR', 'TRAINER'])
  roleCode?: string;

  @ApiPropertyOptional({ example: 'أحمد العتيبي' })
  @IsOptional()
  @IsString()
  fullName?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  refreshToken: string;
}
