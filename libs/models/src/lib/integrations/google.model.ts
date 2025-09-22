import {
  analytics_v3,
  content_v2_1,
  mybusinessaccountmanagement_v1,
  mybusinessbusinessinformation_v1,
  searchconsole_v1,
  tagmanager_v2
} from 'googleapis';
import {
  IBaseAccessRequest,
  IGrantAccessResponse,
  IBaseGetEntityUsersParams,
  IBaseUserInfo,
  IRevokeAccessResponse
} from './integrations.model';

export interface IGoogleBaseAccessService {
  setCredentials(tokens: { access_token?: string; refresh_token?: string }): void;

  grantManagementAccess(entityId: string, agencyEmail: string): Promise<IGrantAccessResponse>;

  grantViewAccess(entityId: string, agencyEmail: string): Promise<IGrantAccessResponse>;

  grantAgencyAccess(request: IBaseAccessRequest): Promise<IGrantAccessResponse>;

  checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null>;

  getEntityUsers(params: IBaseGetEntityUsersParams): Promise<IBaseUserInfo[]>;

  revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse>;

  validateRequiredScopes(grantedScopes: string[]): boolean;

  getRequiredScopes(): string[];
}

// *** Service-specific permission enums ***
export enum GoogleAnalyticsPermission {
  COLLABORATE = 'COLLABORATE',
  EDIT = 'EDIT',
  MANAGE_USERS = 'MANAGE_USERS',
  READ_AND_ANALYZE = 'READ_AND_ANALYZE'
}

export enum GoogleAdsAccessRole {
  ADMIN = 'ADMIN',
  STANDARD = 'STANDARD',
  READ_ONLY = 'READ_ONLY',
  EMAIL_ONLY = 'EMAIL_ONLY'
}

export enum GoogleTagManagerAccountPermission {
  ADMIN = 'admin',
  USER = 'user'
}

export enum GoogleSearchConsolePermissionLevel {
  SITE_OWNER = 'siteOwner',
  SITE_FULL_USER = 'siteFullUser',
  SITE_RESTRICTED_USER = 'siteRestrictedUser',
  SITE_UNVERIFIED_USER = 'siteUnverifiedUser'
}

export enum GoogleMerchantCenterPermission {
  ADMIN = 'ADMIN',
  STANDARD = 'STANDARD'
}

export enum GoogleMyBusinessRole {
  PRIMARY_OWNER = 'PRIMARY_OWNER',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  SITE_MANAGER = 'SITE_MANAGER'
}

export type GoogleServiceType = 'analytics' | 'ads' | 'tagManager' | 'searchConsole' | 'merchantCenter' | 'myBusiness';

export interface IGoogleAdsAccount {
  id: string;
  name: string;
  hasNoPermissions: boolean;
  customerId?: string;
  currencyCode?: string;
  timeZone?: string;
  _id: string;
}

export const GOOGLE_USER_INFO_EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';
export const GOOGLE_USER_INFO_PROFILE_SCOPE = 'https://www.googleapis.com/auth/userinfo.profile';
export const GOOGLE_USER_BIRTHDAY_READ_SCOPE = 'https://www.googleapis.com/auth/user.birthday.read';
export const GOOGLE_USER_PHONENUMBERS_READ_SCOPE = 'https://www.googleapis.com/auth/user.phonenumbers.read';
export const GOOGLE_TAGMANAGER_READONLY_SCOPE = 'https://www.googleapis.com/auth/tagmanager.readonly';
export const GOOGLE_TAGMANAGER_MANAGE_USERS_SCOPE = 'https://www.googleapis.com/auth/tagmanager.manage.users';
export const GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
export const GOOGLE_ANALYTICS_READONLY_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
export const GOOGLE_ANALYTICS_MANAGE_USERS_SCOPE = 'https://www.googleapis.com/auth/analytics.manage.users';
export const GOOGLE_MERCHANT_CENTER_SCOPE = 'https://www.googleapis.com/auth/content';
export const GOOGLE_MY_BUSINESS_MANAGE_SCOPE = 'https://www.googleapis.com/auth/business.manage';
export const GOOGLE_ADWORDS_SCOPE = 'https://www.googleapis.com/auth/adwords';
export const GOOGLE_OPENID_SCOPE = 'openid';

export const GOOGLE_SCOPES = [
  GOOGLE_USER_INFO_EMAIL_SCOPE,
  GOOGLE_USER_INFO_PROFILE_SCOPE,
  GOOGLE_USER_BIRTHDAY_READ_SCOPE,
  GOOGLE_USER_PHONENUMBERS_READ_SCOPE,
  GOOGLE_TAGMANAGER_READONLY_SCOPE,
  GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE,
  GOOGLE_OPENID_SCOPE,
  GOOGLE_TAGMANAGER_MANAGE_USERS_SCOPE,
  GOOGLE_ANALYTICS_READONLY_SCOPE,
  GOOGLE_MERCHANT_CENTER_SCOPE,
  GOOGLE_ANALYTICS_MANAGE_USERS_SCOPE,
  GOOGLE_MY_BUSINESS_MANAGE_SCOPE,
  GOOGLE_ADWORDS_SCOPE
] as const;

// DTO Interfaces
export interface IGoogleConnectionDto {
  idToken: string;
  accessToken: string;
}

// Response Types
export interface IGoogleConnectionResponse {
  user: {
    sub: string;
    email: string;
    email_verified: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture?: string;
    aud: string;
    iss: string;
    iat: number;
    exp: number;
  };
  hasValidTokens: boolean;
  requiresReauth: boolean;
  accounts: IGoogleAccountsData | null;
}

export interface IGoogleAccountsData {
  googleAdsAccounts: IGoogleAdsAccount[];
  googleAnalyticsAccounts: analytics_v3.Schema$Account[];
  googleSearchConsoles: searchconsole_v1.Schema$WmxSite[];
  googleTagManagers: tagmanager_v2.Schema$Account[];
  googleMerchantCenters: content_v2_1.Schema$AccountIdentifier[];
  googleMyBusinessAccounts: mybusinessaccountmanagement_v1.Schema$Account[];
  googleMyBusinessLocations: mybusinessbusinessinformation_v1.Schema$Location[];
  googleGrantedScopes: string[];
}
