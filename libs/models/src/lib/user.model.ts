import {
  IGoogleAdsAccount,
  IGoogleMerchantCenter,
  IGoogleMyBusinessAccount,
  IGoogleMyBusinessLocation,
  IGoogleSearchConsole,
  IGoogleTagManagerAccount
} from './google.model';

export interface IAccessToken {
  access_token: string;
}

export interface IJwtPayload {
  sub: IUserResponse;
  iat: number;
  exp: number;
}

export interface IRegistrationCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  registrationDate: number;
  phone: string | null;
  birthDate: string | null;
  lastSeenDate: number | null;
  googleUserId: string | null;
  googleAccessToken: string | null;
  googleGrantedScopes: string[];
  googleAdsAccounts: IGoogleAdsAccount[];
  googleTagManagerAccounts: IGoogleTagManagerAccount[];
  googleSearchConsoles: IGoogleSearchConsole[];
  googleMyBusinessAccounts: IGoogleMyBusinessAccount[];
  googleMerchantCenters: IGoogleMerchantCenter[];
  googleMyBusinessLocations: IGoogleMyBusinessLocation[];
  facebookUserId: string | null;
  facebookGrantedScopes: string[];
  facebookAccessToken: string | null;
  isLoggedInWithFacebook: boolean;
  isLoggedInWithGoogle: boolean;
}

export interface IUserResponse extends Omit<IRegistrationCredentials, 'password'> {
  _id: string;
}
