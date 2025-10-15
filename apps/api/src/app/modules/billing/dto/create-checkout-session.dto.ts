import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ICreateCheckoutSessionRequest } from '@clientfuse/models';

export class CreateCheckoutSessionDto implements ICreateCheckoutSessionRequest {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsUrl()
  @IsNotEmpty()
  successUrl: string;

  @IsUrl()
  @IsNotEmpty()
  cancelUrl: string;
}
