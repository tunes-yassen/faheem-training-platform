import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonRequestMode, TutorApplicationStatus } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitTutorApplicationDto {
  @ApiProperty()
  @IsString()
  bio: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  yearsExperience: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cvUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idDocumentUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectIds?: string[];
}

export class ReviewTutorApplicationDto {
  @ApiProperty({ enum: [TutorApplicationStatus.APPROVED, TutorApplicationStatus.REJECTED] })
  @IsEnum(TutorApplicationStatus)
  status: TutorApplicationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

export class AvailabilitySlotDto {
  @ApiProperty({ minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '16:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '20:00' })
  @IsString()
  endTime: string;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ type: [AvailabilitySlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}

export class CreateLessonRequestDto {
  @ApiPropertyOptional({ description: 'Required when Parent creates request for a linked child' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiProperty({ enum: LessonRequestMode })
  @IsEnum(LessonRequestMode)
  mode: LessonRequestMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredTutorId?: string;

  @ApiProperty()
  @IsDateString()
  scheduledStart: string;

  @ApiProperty()
  @IsDateString()
  scheduledEnd: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  priceSar?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignTutorDto {
  @ApiProperty()
  @IsString()
  tutorId: string;
}

export class SubmitLessonReportDto {
  @ApiProperty()
  @IsString()
  summary: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  homework?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  progressScore?: number;
}

export class SubmitEvaluationDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
