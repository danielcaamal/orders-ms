import { Order } from '@prisma/client';
import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { OrdersService } from './orders.service';
import { ChangeOrderStatusDto, CreateOrderDto, FilterOrderDto } from './dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: 'create_order' })
  async create(@Payload() createOrderDto: CreateOrderDto): Promise<Order> {
    return await this.ordersService.create(createOrderDto);
  }

  @MessagePattern({ cmd: 'find_all_orders' })
  async findAll(@Payload() filterOrderDto: FilterOrderDto): Promise<{
    data: Order[];
    meta: FilterOrderDto;
  }> {
    return await this.ordersService.findAll(filterOrderDto);
  }

  @MessagePattern({ cmd: 'find_one_order' })
  async findOne(@Payload('id', ParseUUIDPipe) id: string): Promise<Order> {
    return await this.ordersService.findOneDetail(id);
  }

  @MessagePattern({ cmd: 'change_order_status' })
  async changeOrderStatus(
    @Payload() changeOrderStatusDto: ChangeOrderStatusDto,
  ): Promise<Order> {
    return await this.ordersService.changeOrderStatus(changeOrderStatusDto);
  }
}
