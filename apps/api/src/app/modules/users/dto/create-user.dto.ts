import {
  IGoogleAdsAccount,
  IGoogleMerchantCenter,
  IGoogleMyBusinessAccount,
  IGoogleMyBusinessLocation,
  IGoogleSearchConsole,
  IGoogleTagManagerAccount,
  IRegistrationCredentials
} from '@connectly/models';
import { IsBoolean, IsDefined, IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserDto implements IRegistrationCredentials {
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

  @IsNumber()
  @IsDefined()
  registrationDate: number;

  @IsString()
  @IsOptional()
  phone: string | null;

  @IsString()
  @IsOptional()
  birthDate: string | null;

  @IsNumber()
  @IsOptional()
  lastSeenDate: number | null;

  @IsString()
  @IsOptional()
  googleUserId: string | null;

  @IsString()
  @IsOptional()
  googleAccessToken: string | null;

  @IsString({each: true})
  googleGrantedScopes: string[];

  @IsDefined()
  googleAdsAccounts: IGoogleAdsAccount[];

  @IsDefined()
  googleTagManagerAccounts: IGoogleTagManagerAccount[];

  @IsDefined()
  googleSearchConsoles: IGoogleSearchConsole[];

  @IsDefined()
  googleMyBusinessAccounts: IGoogleMyBusinessAccount[];

  @IsDefined()
  googleMerchantCenters: IGoogleMerchantCenter[];

  @IsDefined()
  googleMyBusinessLocations: IGoogleMyBusinessLocation[];

  @IsString()
  @IsOptional()
  facebookUserId: string | null;

  @IsString({each: true})
  facebookGrantedScopes: string[];

  @IsString()
  @IsOptional()
  facebookAccessToken: string | null;

  @IsBoolean()
  @IsOptional()
  isLoggedInWithFacebook: boolean;

  @IsBoolean()
  @IsOptional()
  isLoggedInWithGoogle: boolean;
}
