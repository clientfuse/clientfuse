import { Type } from 'class-transformer';
import { IsArray, IsDate, IsDefined, IsOptional, IsString } from 'class-validator';
import {
  analytics_v3,
  content_v2_1,
  mybusinessaccountmanagement_v1,
  mybusinessbusinessinformation_v1,
  searchconsole_v1,
  tagmanager_v2
} from 'googleapis';
import { IGoogleAdsAccount, IGoogleInfo } from '@connectly/models';

export class GoogleInfoDto implements IGoogleInfo {
  @IsString()
  @IsOptional()
  accessToken: string | null;

  @IsDefined()
  @IsArray()
  adsAccounts: IGoogleAdsAccount[];

  @IsDefined()
  @IsArray()
  analyticsAccounts: analytics_v3.Schema$Account[];

  @IsDefined()
  @IsArray()
  grantedScopes: string[];

  @IsDefined()
  @IsArray()
  merchantCenters: content_v2_1.Schema$AccountIdentifier[];

  @IsDefined()
  @IsArray()
  myBusinessAccounts: mybusinessaccountmanagement_v1.Schema$Account[];

  @IsDefined()
  @IsArray()
  myBusinessLocations: mybusinessbusinessinformation_v1.Schema$Location[];

  @IsString()
  @IsOptional()
  refreshToken: string | null;

  @IsDefined()
  @IsArray()
  searchConsoles: searchconsole_v1.Schema$WmxSite[];

  @IsDefined()
  @IsArray()
  tagManagers: tagmanager_v2.Schema$Account[];

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  tokenExpirationDate: Date | null;

  @IsString()
  @IsOptional()
  userId: string | null;
}

