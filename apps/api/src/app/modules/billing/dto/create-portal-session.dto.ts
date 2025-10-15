import { IsUrl, IsNotEmpty } from 'class-validator';
import { ICreatePortalSessionRequest } from '@clientfuse/models';

export class CreatePortalSessionDto implements ICreatePortalSessionRequest {
  @IsUrl()
  @IsNotEmpty()
  returnUrl: string;
}
