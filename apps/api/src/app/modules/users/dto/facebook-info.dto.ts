import { FacebookAdAccount, FacebookBusinessAccount, FacebookCatalog, FacebookPage, FacebookPixel, IFacebookInfo } from '@clientfuse/models';
import { IsArray, IsDefined, IsOptional, IsString } from 'class-validator';

export class FacebookInfoDto implements IFacebookInfo {
  @IsString()
  @IsDefined()
  accessToken: string | null;

  @IsArray()
  @IsDefined()
  @IsString({ each: true })
  grantedScopes: string[];

  @IsString()
  @IsDefined()
  userId: string | null;

  @IsString()
  @IsOptional()
  email?: string | null;

  @IsArray()
  @IsDefined()
  adsAccounts: FacebookAdAccount[];

  @IsArray()
  @IsDefined()
  businessAccounts: FacebookBusinessAccount[];

  @IsArray()
  @IsDefined()
  pages: FacebookPage[];

  @IsArray()
  @IsDefined()
  catalogs: FacebookCatalog[];

  @IsArray()
  @IsDefined()
  pixels: FacebookPixel[];
}

