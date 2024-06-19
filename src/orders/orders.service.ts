import { PrismaClient } from '@prisma/client';
import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { ChangeOrderStatusDto, CreateOrderDto, FilterOrderDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  async create(createOrderDto: CreateOrderDto) {
    return await this.order.create({
      data: createOrderDto,
    });
  }

  async findAll(filterOrderDto: FilterOrderDto) {
    filterOrderDto.total = await this.order.count({
      where: {
        status: filterOrderDto.status,
      },
    });
    filterOrderDto.lastPage = Math.ceil(
      filterOrderDto.total / filterOrderDto.limit,
    );
    const data = await this.order.findMany({
      where: {
        status: filterOrderDto.status,
      },
      take: filterOrderDto.limit,
      skip: filterOrderDto.skip,
    });

    return {
      data,
      meta: filterOrderDto,
    };
  }

  async findOne(id: string) {
    const result = await this.order.findUnique({
      where: { id },
    });

    if (!result) {
      throw new RpcException({
        message: 'Order not found',
        status: HttpStatus.BAD_REQUEST,
      });
    }
    return result;
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const order = await this.findOne(changeOrderStatusDto.id);
    if (order.status === changeOrderStatusDto.status) {
      return order;
    }

    return await this.order.update({
      where: { id: changeOrderStatusDto.id },
      data: { status: changeOrderStatusDto.status },
    });
  }
}
