import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ICreateCheckoutSessionRequest } from '@clientfuse/models';

export class CreateCheckoutSessionDto implements ICreateCheckoutSessionRequest {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  successUrl: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  cancelUrl: string;
}
