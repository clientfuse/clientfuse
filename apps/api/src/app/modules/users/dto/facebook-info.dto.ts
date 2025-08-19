import { FacebookAdAccount, FacebookBusinessAccount, FacebookCatalog, FacebookPage, IFacebookInfo } from '@clientfuse/models';
import { IsArray, IsDefined, IsString } from 'class-validator';

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
}

