import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AttendanceStatus,
  CorporateQuoteStatus,
  CourseDeliveryMode,
  CourseStatus,
} from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  titleAr: string;

  @ApiProperty()
  @IsString()
  titleEn: string;

  @ApiProperty()
  @IsString()
  summaryAr: string;

  @ApiProperty()
  @IsString()
  descriptionAr: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty({ enum: CourseDeliveryMode })
  @IsEnum(CourseDeliveryMode)
  deliveryMode: CourseDeliveryMode;

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  priceSar: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  durationHours: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ncelAccredited?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ncelProgramCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trainerId?: string;
}

export class CreateCohortDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trainerId?: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  titleAr: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}

export class CreateEnrollmentDto {
  @ApiProperty()
  @IsString()
  cohortId: string;

  @ApiPropertyOptional({ description: 'Optional studentId when enrolled by Parent or Admin' })
  @IsOptional()
  @IsString()
  studentId?: string;
}

export class RecordAttendanceDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateAssessmentDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty()
  @IsString()
  titleAr: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 70 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  questions?: any;
}

export class SubmitAssessmentDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional()
  @IsOptional()
  answers?: any;
}

export class IssueCertificateDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ncelReference?: string;
}

export class CreateCorporateQuoteDto {
  @ApiProperty()
  @IsString()
  companyName: string;

  @ApiProperty()
  @IsString()
  contactName: string;

  @ApiProperty()
  @IsEmail()
  contactEmail: string;

  @ApiProperty()
  @IsString()
  contactPhone: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  traineesCount: number;

  @ApiProperty()
  @IsString()
  courseTopic: string;

  @ApiPropertyOptional({ enum: CourseDeliveryMode })
  @IsOptional()
  @IsEnum(CourseDeliveryMode)
  deliveryMode?: CourseDeliveryMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCorporateQuoteDto {
  @ApiProperty({ enum: CorporateQuoteStatus })
  @IsEnum(CorporateQuoteStatus)
  status: CorporateQuoteStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
