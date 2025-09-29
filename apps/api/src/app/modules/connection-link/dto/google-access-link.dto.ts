import {
  IGoogleAccessLinkWithEmail,
  IGoogleAccessLinkWithEmailOrId,
  TGoogleConnectionLink
} from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsEmail, IsString, IsDefined, ValidateNested } from 'class-validator';
import { AccessLinkBase } from './access-link-base.dto';

export class GoogleAccessLinkWithEmailDto extends AccessLinkBase implements IGoogleAccessLinkWithEmail {
  @IsEmail()
  @IsString()
  @IsDefined()
  email: string;
}

export class GoogleAccessLinkWithEmailOrIdDto extends AccessLinkBase implements IGoogleAccessLinkWithEmailOrId {
  @IsString()
  @IsDefined()
  emailOrId: string;
}

export class GoogleAdsAccessDto extends GoogleAccessLinkWithEmailDto {
  @IsString()
  @IsDefined()
  method: string;
}

export class GoogleAccessDto implements TGoogleConnectionLink {
  @ValidateNested()
  @Type(() => GoogleAdsAccessDto)
  @IsDefined()
  googleAds: GoogleAdsAccessDto;

  @ValidateNested()
  @Type(() => GoogleAccessLinkWithEmailDto)
  @IsDefined()
  googleAnalytics: GoogleAccessLinkWithEmailDto;

  @ValidateNested()
  @Type(() => GoogleAccessLinkWithEmailDto)
  @IsDefined()
  googleMerchantCenter: GoogleAccessLinkWithEmailDto;

  @ValidateNested()
  @Type(() => GoogleAccessLinkWithEmailOrIdDto)
  @IsDefined()
  googleMyBusiness: GoogleAccessLinkWithEmailOrIdDto;

  @ValidateNested()
  @Type(() => GoogleAccessLinkWithEmailDto)
  @IsDefined()
  googleSearchConsole: GoogleAccessLinkWithEmailDto;

  @ValidateNested()
  @Type(() => GoogleAccessLinkWithEmailDto)
  @IsDefined()
  googleTagManager: GoogleAccessLinkWithEmailDto;
}
