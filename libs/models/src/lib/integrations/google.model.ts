export interface ICustomAccessOptions {
  entityId: string;
  agencyEmail: string;
  permissions: string[];
  notifyUser?: boolean;
  customMessage?: string;
  expirationDate?: Date;

  // Service-specific options (will be extended by each service)
  accountId?: string;
  propertyId?: string, // Analytics specific
  viewId?: string, // Analytics specific
  containerId?: string, // GTM specific
  locationName?: string, // My Business specific
  specificLocations?: string[]; // My Business specific
  propertyType?: string; // Search Console specific
  verificationMethod?: string; // Search Console specific
  workspaceId?: string; // Tag Manager specific
}

export interface IBaseAccessRequest {
  entityId: string; // account/property/site ID etc.
  agencyEmail: string;
  permissions: string[];
}

export interface IBaseAccessResponse {
  success: boolean;
  linkId?: string;
  entityId?: string;
  message?: string;
  error?: string;
}

export interface IBaseUserInfo {
  linkId: string;
  email: string;
  permissions: string[];
  kind: string;
  selfLink?: string;
}

export interface IGoogleBaseAccessService {
  setCredentials(tokens: { access_token?: string; refresh_token?: string }): void;

  grantManagementAccess(entityId: string, agencyEmail: string): Promise<IBaseAccessResponse>;

  grantReadOnlyAccess(entityId: string, agencyEmail: string): Promise<IBaseAccessResponse>;

  grantAgencyAccess(request: IBaseAccessRequest): Promise<IBaseAccessResponse>;

  grantCustomAccess(options: ICustomAccessOptions): Promise<IBaseAccessResponse>;

  checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null>;

  getEntityUsers(entityId: string): Promise<IBaseUserInfo[]>;

  revokeUserAccess(entityId: string, linkId: string): Promise<IBaseAccessResponse>;

  validateRequiredScopes(grantedScopes: string[]): boolean;

  getDefaultAgencyPermissions(): string[];

  getAllAvailablePermissions(): string[];

  getRequiredScopes(): string[];
}

// *** Service-specific permission types ***
export type GoogleAnalyticsPermission = 'COLLABORATE' | 'EDIT' | 'MANAGE_USERS' | 'READ_AND_ANALYZE';
export type GoogleAdsPermission = 'ADMIN' | 'STANDARD' | 'READ_ONLY' | 'EMAIL_ONLY';
export type GoogleTagManagerPermission = 'read' | 'edit' | 'delete' | 'publish';
export type GoogleSearchConsolePermission = 'FULL' | 'RESTRICTED';
export type GoogleMerchantCenterPermission = 'ADMIN' | 'STANDARD';
export type GoogleMyBusinessPermission = 'OWNER' | 'MANAGER' | 'SITE_MANAGER';

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
