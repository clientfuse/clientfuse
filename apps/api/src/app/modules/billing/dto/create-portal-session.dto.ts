import { ICreatePortalSessionRequest } from '@clientfuse/models';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreatePortalSessionDto implements ICreatePortalSessionRequest {
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  returnUrl: string;
}
