import { Order } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class CreateOrderPresenter {
  constructor(order: Order, productsMap: Map<number, ProductDto>) {
    this.id = order.id;
    this.totalAmount = order.totalAmount;
    this.totalItems = order.totalItems;
    this.items = ((order as any).items || []).map((item) => {
      const product = productsMap.get(item.productId);
      return {
        orderItemId: item.id,
        productId: item.productId,
        name: product?.name,
        price: item.price,
        quantity: item.quantity,
        available: product?.available,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      } as OrderItemProductDto;
    });
  }

  id: string;
  totalAmount: number;
  totalItems: number;
  items: OrderItemProductDto[];
  paymentSession: PaymentSessionResponseDto;

  setPaymentSession(paymentSession: any) {
    this.paymentSession = new PaymentSessionResponseDto(paymentSession);
  }
}

export class PaymentSessionResponseDto {
  constructor(paymentSession: any) {
    this.id = paymentSession.id;
    this.url = paymentSession.url;
    this.cancelURL = paymentSession.cancel_url;
    this.successURL = paymentSession.success_url;
  }

  id: string;
  url: string;
  cancelURL: string;
  successURL: string;
}

export class OrderItemProductDto {
  orderItemId: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProductDto {
  id: number;
  name: string;
  price: number;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}
