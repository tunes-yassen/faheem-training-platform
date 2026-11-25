import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
  Roles,
} from '../../common/decorators/auth.decorators';
import { PortalsService } from './portals.service';
import {
  CreateTicketDto,
  RequestGuardianLinkDto,
  UpdateTicketDto,
  VerifyGuardianLinkDto,
} from './dto/portals.dto';

@ApiTags('Portals, Guardian Links, Tickets & Analytics')
@ApiBearerAuth()
@Controller('portals')
export class PortalsController {
  constructor(private readonly service: PortalsService) {}

  @Roles('PARENT')
  @Post('guardian/links')
  @ApiOperation({ summary: 'Parent requests link to a student account' })
  requestGuardianLink(
    @Body() dto: RequestGuardianLinkDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.requestGuardianLink(dto, user);
  }

  @Roles('PARENT', 'STUDENT')
  @Post('guardian/links/:id/verify')
  @ApiOperation({ summary: 'Verify guardian-student link with consent record' })
  verifyGuardianLink(
    @Param('id') id: string,
    @Body() dto: VerifyGuardianLinkDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.verifyGuardianLink(id, dto, user, req.ip);
  }

  @Roles('PARENT')
  @Get('guardian/children')
  listLinkedChildren(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listLinkedChildren(user);
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Open support ticket with automatic SLA due date' })
  createTicket(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createTicket(dto, user);
  }

  @Get('tickets')
  listTickets(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listTickets(user);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  @Patch('tickets/:id')
  updateTicket(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateTicket(id, dto, user);
  }

  @Get('notifications')
  listNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listNotifications(user);
  }

  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.markNotificationRead(id, user);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'FINANCE_CHECKER', 'FINANCE_MAKER')
  @Get('analytics/overview')
  @ApiOperation({ summary: 'Admin dashboard KPIs & analytics overview' })
  getAnalyticsOverview() {
    return this.service.getAnalyticsOverview();
  }
}
