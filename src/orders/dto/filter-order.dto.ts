import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common';

export class FilterOrderDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
