import {
  analytics_v3,
  content_v2_1,
  mybusinessaccountmanagement_v1,
  mybusinessbusinessinformation_v1,
  searchconsole_v1,
  tagmanager_v2
} from 'googleapis';
import {
  FACEBOOK_ADS_MANAGEMENT_SCOPE,
  FACEBOOK_BUSINESS_MANAGEMENT_SCOPE,
  FACEBOOK_CATALOG_MANAGEMENT_SCOPE,
  FACEBOOK_EMAIL_SCOPE,
  FACEBOOK_PAGES_MANAGE_METADATA_SCOPE,
  FACEBOOK_PAGES_READ_ENGAGEMENT_SCOPE,
  FACEBOOK_PAGES_SHOW_LIST_SCOPE,
  FACEBOOK_PUBLIC_PROFILE_SCOPE,
  FacebookAdAccount,
  FacebookBusinessAccount,
  FacebookCatalog,
  FacebookPage,
  FacebookPixel
} from './integrations/facebook.model';
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
  email?: string | null;
};

export type IFacebookInfo = {
  accessToken: string | null;
  grantedScopes: string[];
  userId: string | null;
  email?: string | null;
  adsAccounts: FacebookAdAccount[];
  businessAccounts: FacebookBusinessAccount[];
  pages: FacebookPage[];
  catalogs: FacebookCatalog[];
  pixels: FacebookPixel[];
};

export const EMPTY_GOOGLE_INFO: IGoogleInfo = {
  userId: null,
  accessToken: null,
  refreshToken: null,
  tokenExpirationDate: null,
  email: null,
  analyticsAccounts: [],
  adsAccounts: [],
  grantedScopes: [],
  merchantCenters: [],
  searchConsoles: [],
  myBusinessLocations: [],
  myBusinessAccounts: [],
  tagManagers: []
};

export const EMPTY_FACEBOOK_INFO: IFacebookInfo = {
  userId: null,
  accessToken: null,
  email: null,
  grantedScopes: [],
  catalogs: [],
  adsAccounts: [],
  businessAccounts: [],
  pages: [],
  pixels: []
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

  // *** Google Permission Checks ***
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

  // *** Facebook Permission Checks ***
  get isFacebookAdsManagementGranted() {
    return this.facebook.grantedScopes?.includes(FACEBOOK_ADS_MANAGEMENT_SCOPE);
  }

  get isFacebookBusinessManagementGranted() {
    return this.facebook.grantedScopes?.includes(FACEBOOK_BUSINESS_MANAGEMENT_SCOPE);
  }

  get isFacebookCatalogManagementGranted() {
    return this.facebook.grantedScopes?.includes(FACEBOOK_CATALOG_MANAGEMENT_SCOPE);
  }

  get isFacebookEmailGranted() {
    return this.facebook.grantedScopes?.includes(FACEBOOK_EMAIL_SCOPE);
  }

  get isFacebookPagesManageMetadataGranted() {
    return this.facebook.grantedScopes?.includes(FACEBOOK_PAGES_MANAGE_METADATA_SCOPE);
  }

  get isFacebookPagesReadEngagementGranted() {
    return this.facebook.grantedScopes?.includes(FACEBOOK_PAGES_READ_ENGAGEMENT_SCOPE);
  }

  get isFacebookPagesShowListGranted() {
    return this.facebook.grantedScopes?.includes(FACEBOOK_PAGES_SHOW_LIST_SCOPE);
  }

  get isFacebookPublicProfileGranted() {
    return this.facebook.grantedScopes?.includes(FACEBOOK_PUBLIC_PROFILE_SCOPE);
  }
}
