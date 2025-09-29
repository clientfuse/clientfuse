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
  facebookAds: FacebookAccessLinkWithId;

  @ValidateNested()
  @Type(() => FacebookAccessLinkWithId)
  @IsDefined()
  facebookBusiness: FacebookAccessLinkWithId;

  @ValidateNested()
  @Type(() => FacebookAccessLinkWithId)
  @IsDefined()
  facebookPages: FacebookAccessLinkWithId;

  @ValidateNested()
  @Type(() => FacebookAccessLinkWithId)
  @IsDefined()
  facebookCatalogs: FacebookAccessLinkWithId;

  @ValidateNested()
  @Type(() => FacebookAccessLinkWithId)
  @IsDefined()
  facebookPixels: FacebookAccessLinkWithId;
}
