import {
  analytics_v3,
  content_v2_1,
  mybusinessaccountmanagement_v1,
  mybusinessbusinessinformation_v1,
  searchconsole_v1,
  tagmanager_v2
} from 'googleapis';
import {
  GOOGLE_ADWORDS_SCOPE,
  GOOGLE_ANALYTICS_MANAGE_USERS_SCOPE,
  GOOGLE_ANALYTICS_READONLY_SCOPE,
  GOOGLE_MERCHANT_CENTER_SCOPE,
  GOOGLE_MY_BUSINESS_MANAGE_SCOPE,
  GOOGLE_OPENID_SCOPE,
  GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE,
  GOOGLE_TAGMANAGER_MANAGE_USERS_SCOPE,
  GOOGLE_TAGMANAGER_READONLY_SCOPE,
  GOOGLE_USER_BIRTHDAY_READ_SCOPE,
  GOOGLE_USER_INFO_EMAIL_SCOPE,
  GOOGLE_USER_INFO_PROFILE_SCOPE,
  GOOGLE_USER_PHONENUMBERS_READ_SCOPE,
  IGoogleAdsAccount
} from './integrations/google.model';

export interface IAccessToken {
  access_token: string;
}

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
}

export type IGoogleInfo = {
  accessToken: string | null;
  adsAccounts: IGoogleAdsAccount[]; // todo specify type properly
  analyticsAccounts: analytics_v3.Schema$Account[];
  grantedScopes: string[];
  merchantCenters: content_v2_1.Schema$AccountIdentifier[];
  myBusinessAccounts: mybusinessaccountmanagement_v1.Schema$Account[];
  myBusinessLocations: mybusinessbusinessinformation_v1.Schema$Location[];
  refreshToken: string | null;
  searchConsoles: searchconsole_v1.Schema$WmxSite[];
  tagManagers: tagmanager_v2.Schema$Account[];
  tokenExpirationDate: Date | null;
  userId: string | null;
};

export type IFacebookInfo = {
  accessToken: string | null;
  grantedScopes: string[];
  userId: string | null;
};

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
  google: IGoogleInfo;

  // *** Facebook-related fields ***
  facebook: IFacebookInfo;
}

export interface IUserResponse extends Omit<IRegistrationCredentials, 'password'> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User implements IUserResponse {
  birthDate!: string | null;
  email!: string;
  firstName!: string;
  isLoggedInWithFacebook!: boolean;
  isLoggedInWithGoogle!: boolean;
  lastName!: string;
  lastSeenDate!: Date | null;
  phone!: string | null;
  role!: Role;

  google!: IGoogleInfo;
  facebook!: IFacebookInfo;

  _id!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(props: Partial<IUserResponse> = {}) {
    Object.assign(this, props);
  }

  get isGoogleAdsAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_ADWORDS_SCOPE);
  }

  get isGoogleMerchantCenterAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_MERCHANT_CENTER_SCOPE);
  }

  get isGoogleAnalyticsReadOnlyAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_ANALYTICS_READONLY_SCOPE);
  }

  get isGoogleAnalyticsManageUsersAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_ANALYTICS_MANAGE_USERS_SCOPE);
  }

  get isGoogleTagManagerReadOnlyAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_TAGMANAGER_READONLY_SCOPE);
  }

  get isGoogleTagManagerManageUsersAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_TAGMANAGER_MANAGE_USERS_SCOPE);
  }

  get isGoogleMyBusinessManageAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_MY_BUSINESS_MANAGE_SCOPE);
  }

  get isGoogleSearchConsoleReadOnlyAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE);
  }

  get isOpenIdAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_OPENID_SCOPE);
  }

  get isGoogleUserBirthdayReadAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_USER_BIRTHDAY_READ_SCOPE);
  }

  get isGoogleUserInfoEmailAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_USER_INFO_EMAIL_SCOPE);
  }

  get isGoogleUserInfoProfileAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_USER_INFO_PROFILE_SCOPE);
  }

  get isGoogleUserPhoneNumbersReadAccessGranted() {
    return this.google.grantedScopes?.includes(GOOGLE_USER_PHONENUMBERS_READ_SCOPE);
  }
}
