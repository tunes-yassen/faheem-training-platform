import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
  Public,
  Roles,
} from '../../common/decorators/auth.decorators';
import { FinanceService } from './finance.service';
import {
  CreateOrderDto,
  PaymentWebhookDto,
  RequestRefundDto,
  ReviewRefundDto,
  SettleEarningsDto,
} from './dto/finance.dto';

@ApiTags('Finance & Wallet Ledger')
@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @ApiBearerAuth()
  @Get('wallet')
  @ApiOperation({ summary: 'Get computed wallet balance & append-only ledger history' })
  getWallet(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getWalletSummary(user.id);
  }

  @ApiBearerAuth()
  @Post('orders')
  @ApiOperation({ summary: 'Create order and initiate payment intent' })
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createOrder(dto, user);
  }

  @Public()
  @Post('webhooks/payment')
  @ApiOperation({ summary: 'Signed HMAC-SHA256 payment webhook with idempotency protection' })
  handleWebhook(
    @Body() dto: PaymentWebhookDto,
    @Headers('x-faheem-signature') signature?: string,
  ) {
    return this.service.handlePaymentWebhook(dto, signature);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_MAKER', 'FINANCE_CHECKER')
  @Get('refunds')
  listRefunds() {
    return this.service.listRefunds();
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_MAKER')
  @Post('refunds')
  @ApiOperation({ summary: 'Create refund request (Maker step)' })
  requestRefund(
    @Body() dto: RequestRefundDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.requestRefund(dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_CHECKER')
  @Post('refunds/:id/approve')
  @ApiOperation({ summary: 'Approve refund request (Checker step — creator != approver)' })
  approveRefund(
    @Param('id') id: string,
    @Body() dto: ReviewRefundDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.approveRefund(id, dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_CHECKER')
  @Post('refunds/:id/reject')
  rejectRefund(
    @Param('id') id: string,
    @Body() dto: ReviewRefundDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.rejectRefund(id, dto, user, req.ip);
  }

  @ApiBearerAuth()
  @Roles('TUTOR', 'TRAINER')
  @Get('earnings/my')
  getMyEarnings(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyEarnings(user);
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_MAKER', 'FINANCE_CHECKER')
  @Get('earnings')
  listAllEarnings() {
    return this.service.listAllEarnings();
  }

  @ApiBearerAuth()
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_CHECKER')
  @Post('earnings/settle')
  settleEarnings(
    @Body() dto: SettleEarningsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.settleEarnings(dto, user, req.ip);
  }
}
