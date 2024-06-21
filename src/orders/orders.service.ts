import { firstValueFrom } from 'rxjs';
import { Order, OrderStatus, PrismaClient } from '@prisma/client';
import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';

import { NATS_SERVICE } from 'src/config';
import {
  ChangeOrderStatusDto,
  CreateOrderDto,
  CreateOrderPresenter,
  FilterOrderDto,
  PaymentSessionDto,
  PaymentSuccessDto,
  ProductDto,
} from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  private async validateProducts(productIds: number[]): Promise<any[]> {
    try {
      const validProducts = await firstValueFrom(
        this.client.send({ cmd: 'validate_products' }, productIds),
      );
      return validProducts;
    } catch (error) {
      throw new RpcException({
        message: 'Error validating products',
        status: HttpStatus.CONFLICT,
      });
    }
  }

  async createOrder(
    createOrderDto: CreateOrderDto,
  ): Promise<CreateOrderPresenter> {
    const { items } = createOrderDto;
    const productIds = createOrderDto.items.map((item) => item.productId);
    const products = await this.validateProducts(productIds);
    const productsMap: Map<number, ProductDto> = new Map(
      products.map((product) => [product.id, product]),
    );
    let totalItems = 0;
    const totalAmount = items.reduce((acc, orderItem) => {
      const product = productsMap.get(orderItem.productId);
      if (!product) {
        throw new RpcException({
          message: 'Product not found',
          status: HttpStatus.NOT_FOUND,
        });
      }
      totalItems += orderItem.quantity;
      return acc + product.price * orderItem.quantity;
    }, 0);

    const newOrder = await this.order.create({
      data: {
        totalAmount,
        totalItems,
        items: {
          createMany: {
            data: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productsMap.get(item.productId).price,
            })),
          },
        },
      },
      include: {
        items: true,
      },
    });
    return new CreateOrderPresenter(newOrder, productsMap);
  }

  async findAll(
    filterOrderDto: FilterOrderDto,
  ): Promise<{ data: Order[]; meta: FilterOrderDto }> {
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

  async findOne(id: string): Promise<Order> {
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

  async findOneDetail(id: string): Promise<Order> {
    const result = await this.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!result) {
      throw new RpcException({
        message: 'Order not found',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const productsIds = result.items.map((item) => item.productId);
    const products = await this.validateProducts(productsIds);
    const productsMap: Map<number, any> = new Map(
      products.map((product) => [product.id, product]),
    );

    result.items = result.items.map((item) => {
      const product = productsMap.get(item.productId);
      return {
        ...item,
        productId: undefined,
        product,
      };
    });

    return result;
  }

  async changeOrderStatus(
    changeOrderStatusDto: ChangeOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOne(changeOrderStatusDto.id);
    if (order.status === changeOrderStatusDto.status) {
      return order;
    }

    return await this.order.update({
      where: { id: changeOrderStatusDto.id },
      data: { status: changeOrderStatusDto.status },
    });
  }

  private paymentSessionAdapter(
    createOrderPresenter: CreateOrderPresenter,
  ): PaymentSessionDto {
    return {
      orderId: createOrderPresenter.id,
      currency: 'mxn',
      items: createOrderPresenter.items.map((product) => ({
        name: product.name,
        price: product.price,
        quantity: product.quantity,
      })),
    };
  }

  async createSession(createOrderPresenter: CreateOrderPresenter) {
    try {
      const paymentSessionDto: PaymentSessionDto =
        this.paymentSessionAdapter(createOrderPresenter);
      const validProducts = await firstValueFrom(
        this.client.send({ cmd: 'create_payment_session' }, paymentSessionDto),
      );
      return validProducts;
    } catch (error) {
      throw new RpcException({
        message: 'Error creating the session',
        status: HttpStatus.CONFLICT,
      });
    }
  }

  async create(createOrderDto: CreateOrderDto) {
    const newOrder = await this.createOrder(createOrderDto);
    const paymentSession = await this.createSession(newOrder);
    newOrder.setPaymentSession(paymentSession);
    return newOrder;
  }

  async paymentSucceeded(paymentSuccessDto: PaymentSuccessDto) {
    const { orderId, stripePaymentId, receiptUrl } = paymentSuccessDto;
    const order = await this.findOne(orderId);

    return await this.order.update({
      where: { id: order.id },
      data: {
        paid: true,
        paidAt: new Date(),
        status: OrderStatus.PAID,
        stripeChargeId: stripePaymentId,
        OrderReceipt: {
          create: {
            receiptUrl,
          },
        },
      },
    });
  }
}
