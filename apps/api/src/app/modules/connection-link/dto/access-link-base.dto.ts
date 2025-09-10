import { IConnectionLinkItemBase } from '@clientfuse/models';
import { IsBoolean, IsDefined } from 'class-validator';

export class AccessLinkBase implements IConnectionLinkItemBase {
  @IsBoolean()
  @IsDefined()
  isViewAccessEnabled: boolean;

  @IsBoolean()
  @IsDefined()
  isManageAccessEnabled: boolean;
}
