import { IsString, IsUrl, IsUUID } from 'class-validator';

export class PaymentSuccessDto {
  @IsUUID()
  orderId: string;

  @IsString()
  stripePaymentId: string;

  @IsUrl()
  receiptUrl: string;
}
