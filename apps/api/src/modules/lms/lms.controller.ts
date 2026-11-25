import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CourseDeliveryMode } from '@prisma/client';
import { Request } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
  Public,
  Roles,
} from '../../common/decorators/auth.decorators';
import { LmsService } from './lms.service';
import {
  CreateAssessmentDto,
  CreateCohortDto,
  CreateCorporateQuoteDto,
  CreateCourseDto,
  CreateEnrollmentDto,
  IssueCertificateDto,
  RecordAttendanceDto,
  SubmitAssessmentDto,
  UpdateCorporateQuoteDto,
} from './dto/lms.dto';

@ApiTags('LMS & Certificates')
@Controller()
export class LmsController {
  constructor(private readonly service: LmsService) {}

  @Public()
  @Get('lms/courses')
  @ApiOperation({ summary: 'Browse published courses (IN_PERSON, LIVE_ONLINE, RECORDED)' })
  listCourses(
    @Query('mode') mode?: CourseDeliveryMode,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listCourses({ mode, category, search });
  }

  @Public()
  @Get('lms/courses/:id')
  @ApiOperation({ summary: 'Get course details with cohorts & materials' })
  getCourse(@Param('id') id: string) {
    return this.service.getCourse(id);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'TRAINER')
  @Post('lms/courses')
  createCourse(
    @Body() dto: CreateCourseDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.createCourse(dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'TRAINER')
  @Patch('lms/courses/:id')
  updateCourse(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCourseDto>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.updateCourse(id, dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'TRAINER')
  @Post('lms/cohorts')
  createCohort(@Body() dto: CreateCohortDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createCohort(dto, user);
  }

  @ApiBearerAuth()
  @Roles('STUDENT', 'PARENT', 'ADMIN', 'SUPER_ADMIN')
  @Post('lms/enrollments')
  @ApiOperation({ summary: 'Enroll in cohort (prevents duplicate paid seat)' })
  enroll(
    @Body() dto: CreateEnrollmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.enroll(dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Get('lms/enrollments/my')
  getMyEnrollments(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyEnrollments(user);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'TRAINER')
  @Post('lms/attendance')
  recordAttendance(@Body() dto: RecordAttendanceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.recordAttendance(dto, user);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'TRAINER')
  @Post('lms/assessments')
  createAssessment(@Body() dto: CreateAssessmentDto) {
    return this.service.createAssessment(dto);
  }

  @ApiBearerAuth()
  @Roles('STUDENT')
  @Post('lms/assessments/:id/submit')
  submitAssessment(
    @Param('id') id: string,
    @Body() dto: SubmitAssessmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.submitAssessment(id, dto, user);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'TRAINER')
  @Post('lms/certificates/issue')
  issueCertificate(
    @Body() dto: IssueCertificateDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.issueCertificate(dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Get('lms/certificates/my')
  getMyCertificates(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyCertificates(user);
  }

  @Public()
  @Get('verify/:code')
  @ApiOperation({ summary: 'Public certificate verification by serial or QR verification code' })
  verifyCertificate(@Param('code') code: string) {
    return this.service.verifyCertificate(code);
  }

  @Public()
  @Post('lms/corporate-quotes')
  @ApiOperation({ summary: 'Submit Corporate B2B training quote request' })
  createCorporateQuote(@Body() dto: CreateCorporateQuoteDto) {
    return this.service.createCorporateQuote(dto);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  @Get('lms/corporate-quotes')
  listCorporateQuotes() {
    return this.service.listCorporateQuotes();
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  @Patch('lms/corporate-quotes/:id')
  updateCorporateQuote(
    @Param('id') id: string,
    @Body() dto: UpdateCorporateQuoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateCorporateQuote(id, dto, user);
  }
}
