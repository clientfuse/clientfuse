import {
  TFacebookAccessLink,
  TFacebookConnectionLinkWithId
} from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsDefined, ValidateNested } from 'class-validator';
import { AccessLinkBase } from './access-link-base.dto';

export class FacebookAccessLinkWithId extends AccessLinkBase implements TFacebookConnectionLinkWithId {
  @IsString()
  @IsOptional()
  businessPortfolioId: string;
}

export class FacebookAccessDto implements TFacebookAccessLink {
  @ValidateNested()
  @Type(() => FacebookAccessLinkWithId)
  @IsDefined()
  ads: FacebookAccessLinkWithId;

  @ValidateNested()
  @Type(() => FacebookAccessLinkWithId)
  @IsDefined()
  business: FacebookAccessLinkWithId;

  @ValidateNested()
  @Type(() => FacebookAccessLinkWithId)
  @IsDefined()
  pages: FacebookAccessLinkWithId;

  @ValidateNested()
  @Type(() => FacebookAccessLinkWithId)
  @IsDefined()
  catalogs: FacebookAccessLinkWithId;
}
