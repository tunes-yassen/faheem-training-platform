import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderType } from '@prisma/client';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amountSar: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ default: 'MOYASAR' })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class PaymentWebhookDto {
  @ApiProperty()
  @IsString()
  idempotencyKey: string;

  @ApiProperty()
  @IsString()
  paymentId: string;

  @ApiProperty()
  @IsString()
  providerRef: string;

  @ApiProperty({ example: 'CAPTURED' })
  @IsString()
  status: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amountSar: number;
}

export class RequestRefundDto {
  @ApiProperty()
  @IsString()
  paymentId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amountSar: number;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class ReviewRefundDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

export class SettleEarningsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  earningIds: string[];

  @ApiProperty()
  @IsString()
  settlementRef: string;
}
