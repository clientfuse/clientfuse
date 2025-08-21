import {
  IAccessLinkBase,
  IAgencyBase,
  IGoogleAccessLinkWithEmail,
  IGoogleAccessLinkWithEmailOrId, TAccessLink,
  TFacebookAccessLink,
  TFacebookAccessLinkWithId,
  TGoogleAccessLink
} from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';

export class AccessLinkBase implements IAccessLinkBase {
  @IsBoolean()
  @IsDefined()
  isViewAccessEnabled: boolean;

  @IsBoolean()
  @IsDefined()
  isManageAccessEnabled: boolean;
}

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

export class GoogleAccessDto implements TGoogleAccessLink {
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

export class FacebookAccessLinkWithId extends AccessLinkBase implements TFacebookAccessLinkWithId {
  @IsString()
  @IsOptional()
  entityId: string;
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

export class DefaultAccessLinkDto implements TAccessLink {
  @ValidateNested()
  @Type(() => GoogleAccessDto)
  @IsOptional()
  google?: GoogleAccessDto;

  @ValidateNested()
  @Type(() => FacebookAccessDto)
  @IsOptional()
  facebook?: FacebookAccessDto;
}

export class CreateAgencyDto implements IAgencyBase {
  @IsString()
  @IsDefined()
  userId: string;

  @IsEmail()
  @IsString()
  @IsDefined()
  email: string;

  @ValidateNested()
  @Type(() => DefaultAccessLinkDto)
  @IsDefined()
  defaultAccessLink: DefaultAccessLinkDto;
}
