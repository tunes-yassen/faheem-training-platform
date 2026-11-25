import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingCategory } from '@prisma/client';
import { Request } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
  Public,
  Roles,
} from '../../common/decorators/auth.decorators';
import { AdminSettingsService } from './admin-settings.service';
import {
  BulkUpsertSettingsDto,
  CreatePolicyDto,
  CreateRoleDto,
  UpdateRolePermissionsDto,
  UpdateUserStatusDto,
  UpsertCmsPageDto,
  UpsertSettingDto,
} from './dto/admin-settings.dto';

@ApiTags('Admin Settings & Governance')
@Controller()
export class AdminSettingsController {
  constructor(private readonly service: AdminSettingsService) {}

  // Dynamic System Settings
  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/settings')
  @ApiOperation({ summary: 'List system settings grouped by category (secrets masked)' })
  getSettings(@Query('category') category?: SettingCategory) {
    return this.service.getSettings(category);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Put('admin/settings/:key')
  @ApiOperation({ summary: 'Create or update a system setting (encrypts secrets)' })
  upsertSetting(
    @Param('key') key: string,
    @Body() dto: UpsertSettingDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.upsertSetting(key, dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/settings/bulk')
  @ApiOperation({ summary: 'Bulk create or update system settings' })
  bulkUpsertSettings(
    @Body() dto: BulkUpsertSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.bulkUpsertSettings(dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('admin/settings/:key')
  @ApiOperation({ summary: 'Delete a system setting' })
  deleteSetting(
    @Param('key') key: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.deleteSetting(key, user, req.ip);
  }

  // Policies
  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/policies')
  listPolicies() {
    return this.service.listPolicies();
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/policies')
  createPolicy(
    @Body() dto: CreatePolicyDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.createPolicy(dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/policies/:id/activate')
  activatePolicy(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.activatePolicy(id, user, req.ip);
  }

  // CMS Pages
  @Public()
  @Get('cms/:slug')
  @ApiOperation({ summary: 'Public CMS page by slug' })
  getPublicCmsPage(@Param('slug') slug: string) {
    return this.service.getPublicCmsPage(slug);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/cms')
  listCmsPages() {
    return this.service.listCmsPages();
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/cms')
  createCmsPage(
    @Body() dto: UpsertCmsPageDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.createCmsPage(dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/cms/:id')
  updateCmsPage(
    @Param('id') id: string,
    @Body() dto: Partial<UpsertCmsPageDto>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.updateCmsPage(id, dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('admin/cms/:id')
  deleteCmsPage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.deleteCmsPage(id, user, req.ip);
  }

  // RBAC Matrix
  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/roles')
  listRoles() {
    return this.service.listRoles();
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/permissions')
  listPermissions() {
    return this.service.listPermissions();
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/roles')
  createRole(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.createRole(dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Put('admin/roles/:id/permissions')
  updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.updateRolePermissions(id, dto, user, req.ip);
  }

  // Audit Logs (Read-only)
  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_CHECKER')
  @Get('admin/audit-logs')
  @ApiOperation({ summary: 'Read-only immutable audit logs' })
  listAuditLogs(
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('actorId') actorId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.listAuditLogs({ action, entityType, actorId, page, limit });
  }

  // Users Directory
  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  @Get('admin/users')
  listUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listUsers({ role, status, search });
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/users/:id/status')
  updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.updateUserStatus(id, dto, user, req.ip);
  }
}
