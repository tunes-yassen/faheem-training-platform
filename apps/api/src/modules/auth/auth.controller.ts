import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
  Public,
} from '../../common/decorators/auth.decorators';
import { AuthService } from './auth.service';
import { RefreshTokenDto, RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('otp/request')
  @ApiOperation({ summary: 'Request OTP via SMS or Email' })
  requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    return this.authService.requestOtp(dto, req.ip);
  }

  @Public()
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and issue JWT access & refresh tokens' })
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.authService.verifyOtp(dto, req.ip);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and get new JWT access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke refresh tokens' })
  logout(@CurrentUser() user: AuthenticatedUser, @Body() body?: { refreshToken?: string }) {
    return this.authService.logout(user.id, body?.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile & permissions' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }
}
