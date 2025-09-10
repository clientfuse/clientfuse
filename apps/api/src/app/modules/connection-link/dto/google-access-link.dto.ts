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
  ads: GoogleAdsAccessDto;

  @ValidateNested()
  @Type(() => GoogleAccessLinkWithEmailDto)
  @IsDefined()
  analytics: GoogleAccessLinkWithEmailDto;

  @ValidateNested()
  @Type(() => GoogleAccessLinkWithEmailDto)
  @IsDefined()
  merchantCenter: GoogleAccessLinkWithEmailDto;

  @ValidateNested()
  @Type(() => GoogleAccessLinkWithEmailOrIdDto)
  @IsDefined()
  myBusiness: GoogleAccessLinkWithEmailOrIdDto;

  @ValidateNested()
  @Type(() => GoogleAccessLinkWithEmailDto)
  @IsDefined()
  searchConsole: GoogleAccessLinkWithEmailDto;

  @ValidateNested()
  @Type(() => GoogleAccessLinkWithEmailDto)
  @IsDefined()
  tagManager: GoogleAccessLinkWithEmailDto;
}
