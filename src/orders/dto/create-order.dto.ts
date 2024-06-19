import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalAmount: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalItems: number;

  @IsEnum(OrderStatus)
  @IsOptional()
  status: OrderStatus = 'PENDING';

  @IsOptional()
  @IsBoolean()
  paid?: boolean = false;
}
