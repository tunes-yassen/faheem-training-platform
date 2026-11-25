import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TutorApplicationStatus } from '@prisma/client';
import { Request } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
  Public,
  Roles,
} from '../../common/decorators/auth.decorators';
import { TutoringService } from './tutoring.service';
import {
  AssignTutorDto,
  CreateLessonRequestDto,
  ReviewTutorApplicationDto,
  SubmitEvaluationDto,
  SubmitLessonReportDto,
  SubmitTutorApplicationDto,
  UpdateAvailabilityDto,
} from './dto/tutoring.dto';

@ApiTags('Tutoring')
@Controller('tutoring')
export class TutoringController {
  constructor(private readonly service: TutoringService) {}

  @Public()
  @Get('subjects')
  listSubjects() {
    return this.service.listSubjects();
  }

  @Public()
  @Get('grades')
  listGrades() {
    return this.service.listGrades();
  }

  @Public()
  @Get('packages')
  listPackages() {
    return this.service.listPackages();
  }

  @Public()
  @Get('tutors')
  @ApiOperation({ summary: 'Browse approved tutors' })
  listApprovedTutors(@Query('subjectId') subjectId?: string) {
    return this.service.listApprovedTutors(subjectId);
  }

  @ApiBearerAuth()
  @Roles('TUTOR')
  @Post('applications')
  submitApplication(
    @Body() dto: SubmitTutorApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.submitApplication(dto, user);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  @Get('applications')
  listApplications(@Query('status') status?: TutorApplicationStatus) {
    return this.service.listApplications(status);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('applications/:id/review')
  reviewApplication(
    @Param('id') id: string,
    @Body() dto: ReviewTutorApplicationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.reviewApplication(id, dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('TUTOR')
  @Get('availability/my')
  getMyAvailability(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyAvailability(user);
  }

  @ApiBearerAuth()
  @Roles('TUTOR')
  @Put('availability')
  updateAvailability(@Body() dto: UpdateAvailabilityDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.updateAvailability(dto, user);
  }

  @ApiBearerAuth()
  @Roles('STUDENT', 'PARENT', 'COORDINATOR', 'ADMIN', 'SUPER_ADMIN')
  @Post('requests')
  @ApiOperation({ summary: 'Create lesson request (DIRECT, OPEN_AUTO_MATCH, COORDINATOR)' })
  createLessonRequest(
    @Body() dto: CreateLessonRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.createLessonRequest(dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Get('requests')
  @ApiOperation({ summary: 'List role-scoped lesson requests (unapproved tutors blocked)' })
  listLessonRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listLessonRequests(user);
  }

  @ApiBearerAuth()
  @Roles('TUTOR')
  @Post('requests/:id/accept')
  @ApiOperation({ summary: 'Atomically accept an open or direct lesson request' })
  acceptLessonRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.acceptLessonRequest(id, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('COORDINATOR', 'ADMIN', 'SUPER_ADMIN')
  @Post('requests/:id/assign')
  @ApiOperation({ summary: 'Coordinator assigns an approved tutor atomically' })
  assignTutor(
    @Param('id') id: string,
    @Body() dto: AssignTutorDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.coordinatorAssignTutor(id, dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Get('bookings/my')
  getMyBookings(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyBookings(user);
  }

  @ApiBearerAuth()
  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session details (with horizontal IDOR protection)' })
  getSession(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getSessionSecure(id, user);
  }

  @ApiBearerAuth()
  @Roles('TUTOR', 'ADMIN', 'SUPER_ADMIN')
  @Post('sessions/:id/report')
  submitLessonReport(
    @Param('id') id: string,
    @Body() dto: SubmitLessonReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.submitLessonReport(id, dto, user);
  }

  @ApiBearerAuth()
  @Roles('STUDENT', 'PARENT')
  @Post('sessions/:id/evaluate')
  submitEvaluation(
    @Param('id') id: string,
    @Body() dto: SubmitEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.submitEvaluation(id, dto, user);
  }
}
