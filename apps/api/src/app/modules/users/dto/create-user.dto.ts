import { IGoogleAdsAccount, IRegistrationCredentials, Role } from '@connectly/models';
import { IsBoolean, IsDate, IsDefined, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  analytics_v3,
  content_v2_1,
  mybusinessaccountmanagement_v1,
  mybusinessbusinessinformation_v1,
  searchconsole_v1,
  tagmanager_v2
} from 'googleapis';

export class CreateUserDto implements IRegistrationCredentials {
  // *** User identification fields ***
  @IsEmail()
  @IsString()
  @IsDefined()
  email: string;

  @IsString()
  @IsDefined()
  password: string;

  @IsString()
  @IsDefined()
  firstName: string;

  @IsString()
  @IsDefined()
  lastName: string;

  @IsString()
  @IsOptional()
  phone: string | null;

  @IsString()
  @IsOptional()
  birthDate: string | null;

  @IsDate()
  @IsOptional()
  lastSeenDate: Date | null;

  @IsEnum(Role)
  role: Role;

  // *** Google-related fields ***
  @IsString()
  @IsOptional()
  googleUserId: string | null;

  @IsString()
  @IsOptional()
  googleAccessToken: string | null;

  @IsString()
  @IsOptional()
  googleRefreshToken: string | null;

  @IsDate()
  @IsOptional()
  googleTokenExpirationDate: Date | null;

  @IsString({ each: true })
  googleGrantedScopes: string[];

  @IsDefined()
  googleAdsAccounts: IGoogleAdsAccount[];

  @IsDefined()
  googleAnalyticsAccounts: analytics_v3.Schema$Account[];

  @IsDefined()
  googleSearchConsoles: searchconsole_v1.Schema$WmxSite[];

  @IsDefined()
  googleTagManagers: tagmanager_v2.Schema$Account[];

  @IsDefined()
  googleMerchantCenters: content_v2_1.Schema$AccountIdentifier[];

  @IsDefined()
  googleMyBusinessAccounts: mybusinessaccountmanagement_v1.Schema$Account[];

  @IsDefined()
  googleMyBusinessLocations: mybusinessbusinessinformation_v1.Schema$Location[];

  @IsBoolean()
  @IsOptional()
  isLoggedInWithGoogle: boolean;

  // *** Facebook-related fields ***
  @IsString()
  @IsOptional()
  facebookUserId: string | null;

  @IsString({ each: true })
  facebookGrantedScopes: string[];

  @IsString()
  @IsOptional()
  facebookAccessToken: string | null;

  @IsBoolean()
  @IsOptional()
  isLoggedInWithFacebook: boolean;
}
