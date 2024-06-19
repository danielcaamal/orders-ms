import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsUUID } from 'class-validator';

export class ChangeOrderStatusDto {
  @IsUUID()
  id: string;

  @IsEnum(OrderStatus)
  @Type(() => String)
  status: OrderStatus = OrderStatus.PENDING;
}
