import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConversationType, CourseLogType } from '@prisma/client';
import { Request } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
  Roles,
} from '../../common/decorators/auth.decorators';
import { GovernanceService } from './governance.service';
import {
  CreateConversationDto,
  CreateStaffDto,
  PostConversationMessageDto,
  UpdateGuardianControlsDto,
  UpdateGuardianLinkStatusDto,
  UpdateInstructorDto,
  UpdateStaffDto,
} from './dto/governance.dto';

@ApiTags('Enterprise Governance (Staff, Instructors, Conversations, Course Logs, Guardians)')
@ApiBearerAuth()
@Controller()
export class GovernanceController {
  constructor(private readonly service: GovernanceService) {}

  // 1. Staff Management
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/staff')
  @ApiOperation({ summary: 'List internal staff users with roles & departments' })
  listStaff() {
    return this.service.listStaff();
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/staff')
  @ApiOperation({ summary: 'Create internal staff user with role & department' })
  createStaff(
    @Body() dto: CreateStaffDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.createStaff(dto, user, req.ip);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/staff/:id')
  @ApiOperation({ summary: 'Update staff role, status, department, or custom permissions' })
  updateStaff(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.updateStaff(id, dto, user, req.ip);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/staff/daily-report')
  @ApiOperation({ summary: 'Daily CS & Coordinator tasks, tickets, calls & SLA summary' })
  getStaffDailyReport() {
    return this.service.getStaffDailyReport();
  }

  // 2. Trainers & Tutors Governance
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/instructors')
  @ApiOperation({ summary: 'List Trainers & Tutors with compensation models, flags & stats' })
  listInstructors(@Query('role') role?: string) {
    return this.service.listInstructors(role);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/instructors/:id')
  @ApiOperation({ summary: 'Approve/suspend instructor, set compensation model & flags, assign courses/cohorts' })
  updateInstructor(
    @Param('id') id: string,
    @Body() dto: UpdateInstructorDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.updateInstructor(id, dto, user, req.ip);
  }

  // 3. Conversations & Call Logs
  @Get('portals/conversations')
  @ApiOperation({ summary: 'List conversation threads for current user' })
  listMyConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMyConversations(user);
  }

  @Post('portals/conversations')
  @ApiOperation({ summary: 'Create a new chat, call log, or coordinator note thread' })
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createConversation(dto, user);
  }

  @Post('portals/conversations/:id/messages')
  @ApiOperation({ summary: 'Post a message to an existing conversation thread' })
  postMessage(
    @Param('id') id: string,
    @Body() dto: PostConversationMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.postConversationMessage(id, dto, user);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/conversations')
  @ApiOperation({ summary: 'Super Admin oversight of all conversations & call logs' })
  adminListConversations(
    @Query('search') search?: string,
    @Query('type') type?: ConversationType,
    @Query('status') status?: string,
  ) {
    return this.service.adminListConversations({ search, type, status });
  }

  @Roles('SUPER_ADMIN')
  @Delete('admin/conversations/messages/:id')
  @ApiOperation({ summary: 'SUPER_ADMIN only: soft-delete a message with mandatory AuditLog' })
  superAdminDeleteMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.superAdminDeleteMessage(id, user, req.ip);
  }

  // 4. Course Execution & Operations Logs
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  @Get('admin/course-logs')
  @ApiOperation({ summary: 'Chronological course execution & operations logs' })
  listCourseExecutionLogs(
    @Query('courseId') courseId?: string,
    @Query('logType') logType?: CourseLogType,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listCourseExecutionLogs({ courseId, logType, from, to, search });
  }

  // 5. Expanded Guardian Governance & Controls
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/guardians')
  @ApiOperation({ summary: 'List all parents/guardians with linked children & controls' })
  adminListGuardians() {
    return this.service.adminListGuardians();
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/guardians/links/:id/status')
  @ApiOperation({ summary: 'Approve or revoke a guardian-student link (audited)' })
  adminUpdateGuardianLinkStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGuardianLinkStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.adminUpdateGuardianLinkStatus(id, dto, user, req.ip);
  }

  @Roles('PARENT', 'SUPER_ADMIN', 'ADMIN')
  @Patch('portals/guardian/links/:id/controls')
  @ApiOperation({ summary: 'Update per-child spending cap & session controls' })
  updateGuardianControls(
    @Param('id') id: string,
    @Body() dto: UpdateGuardianControlsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.updateGuardianControls(id, dto, user, req.ip);
  }
}
