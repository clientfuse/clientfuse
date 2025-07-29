import { IAgencyBase, IGoogleAccessLinkBase } from '@connectly/models';
import { Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsEmail, IsObject, IsString, ValidateNested } from 'class-validator';

export class GoogleAccessLinkBaseDto implements IGoogleAccessLinkBase {
  @IsBoolean()
  @IsDefined()
  isViewAccessEnabled: boolean;

  @IsBoolean()
  @IsDefined()
  isManageAccessEnabled: boolean;
}

export class GoogleAccessLinkWithEmailDto extends GoogleAccessLinkBaseDto {
  @IsEmail()
  @IsString()
  @IsDefined()
  email: string;
}

export class GoogleAccessLinkWithEmailOrIdDto extends GoogleAccessLinkBaseDto {
  @IsString()
  @IsDefined()
  emailOrId: string;
}

export class GoogleAdsAccessDto extends GoogleAccessLinkWithEmailDto {
  @IsString()
  @IsDefined()
  method: string;
}

export class GoogleAccessDto {
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

export class DefaultAccessLinkDto {
  @ValidateNested()
  @Type(() => GoogleAccessDto)
  @IsDefined()
  google: GoogleAccessDto;

  @IsDefined()
  @IsObject()
  facebook: {} = {};
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
