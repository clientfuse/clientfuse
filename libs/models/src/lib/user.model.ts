import {
  analytics_v3,
  content_v2_1,
  mybusinessaccountmanagement_v1,
  mybusinessbusinessinformation_v1,
  searchconsole_v1,
  tagmanager_v2
} from 'googleapis';
import { IGoogleAdsAccount } from './google.model';

export interface IAccessToken {
  access_token: string;
}

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
}

export interface IRegistrationCredentials {
  // *** User identification fields ***
  birthDate: string | null;
  email: string;
  firstName: string;
  isLoggedInWithFacebook: boolean;
  isLoggedInWithGoogle: boolean;
  lastName: string;
  lastSeenDate: Date | null;
  password: string;
  phone: string | null;
  role: Role;

  // *** Google-related fields ***
  googleAccessToken: string | null;
  googleAdsAccounts: IGoogleAdsAccount[]; // todo specify type properly
  googleAnalyticsAccounts: analytics_v3.Schema$Account[];
  googleGrantedScopes: string[];
  googleMerchantCenters: content_v2_1.Schema$AccountIdentifier[];
  googleMyBusinessAccounts: mybusinessaccountmanagement_v1.Schema$Account[];
  googleMyBusinessLocations: mybusinessbusinessinformation_v1.Schema$Location[];
  googleRefreshToken: string | null;
  googleSearchConsoles: searchconsole_v1.Schema$WmxSite[];
  googleTagManagers: tagmanager_v2.Schema$Account[];
  googleTokenExpirationDate: Date | null;
  googleUserId: string | null;

  // *** Facebook-related fields ***
  facebookAccessToken: string | null;
  facebookGrantedScopes: string[];
  facebookUserId: string | null;
}

export interface IUserResponse extends Omit<IRegistrationCredentials, 'password'> {
  _id: string;
}
