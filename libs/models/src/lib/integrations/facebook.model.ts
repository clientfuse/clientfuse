export interface IFacebookCustomAccessOptions {
  entityId: string;
  agencyEmail: string;
  permissions: string[];
  notifyUser?: boolean;
  customMessage?: string;
  expirationDate?: Date;

  // Service-specific options
  businessId?: string;
  roleType?: string; // 'ADMIN' | 'EMPLOYEE' | 'ADVERTISER'
  pageId?: string; // Page specific access
  adAccountId?: string; // Ad Account specific access
  catalogId?: string; // Catalog specific access
}

export interface IFacebookAccessRequest {
  entityId: string; // business/page/ad account ID
  agencyEmail: string;
  permissions: string[];
  roleType?: string;
}

export interface IFacebookAccessResponse {
  success: boolean;
  linkId?: string;
  entityId?: string;
  message?: string;
  error?: string;
  requiresManualApproval?: boolean; // Facebook specific
  businessManagerUrl?: string; // Direct link for manual actions
}

export interface IFacebookUserInfo {
  linkId: string;
  email: string;
  permissions: string[];
  kind: string;
  status?: string; // 'PENDING' | 'ACTIVE' | 'DECLINED'
  roleType?: string;
  selfLink?: string;
}

export interface IFacebookBaseAccessService {
  setCredentials(tokens: { access_token: string }): void;

  grantManagementAccess(entityId: string, agencyEmail: string): Promise<IFacebookAccessResponse>;

  grantReadOnlyAccess(entityId: string, agencyEmail: string): Promise<IFacebookAccessResponse>;

  grantAgencyAccess(request: IFacebookAccessRequest): Promise<IFacebookAccessResponse>;

  grantCustomAccess(options: IFacebookCustomAccessOptions): Promise<IFacebookAccessResponse>;

  checkExistingUserAccess(entityId: string, email: string): Promise<IFacebookUserInfo | null>;

  getEntityUsers(entityId: string): Promise<IFacebookUserInfo[]>;

  revokeUserAccess(entityId: string, linkId: string): Promise<IFacebookAccessResponse>;

  validateRequiredScopes(grantedScopes: string[]): boolean;

  getDefaultAgencyPermissions(): string[];

  getAllAvailablePermissions(): string[];

  getRequiredScopes(): string[];
}


export type FacebookAccountStatus = 'ACTIVE' | 'DISABLED' | 'UNSETTLED';

export type FacebookAdAccountTask = 'DRAFT' | 'ANALYZE' | 'ADVERTISE' | 'MANAGE';
export type FacebookPageTask = 'ADVERTISE' | 'ANALYZE' | 'CREATE_CONTENT' | 'MESSAGING' | 'MODERATE' | 'MANAGE';

export type FacebookBusinessRole = 'ADMIN' | 'EMPLOYEE' | 'PARTNER';
export type TwoFactorStatus = 'enabled' | 'disabled';

export type FacebookService = 'ads' | 'pages' | 'instagram' | 'catalogs' | 'pixels';

export const FACEBOOK_ADS_MANAGEMENT_SCOPE = 'ads_management';
export const FACEBOOK_BUSINESS_MANAGEMENT_SCOPE = 'business_management';
export const FACEBOOK_CATALOG_MANAGEMENT_SCOPE = 'catalog_management';
export const FACEBOOK_EMAIL_SCOPE = 'email';
export const FACEBOOK_PAGES_MANAGE_METADATA_SCOPE = 'pages_manage_metadata';
export const FACEBOOK_PAGES_READ_ENGAGEMENT_SCOPE = 'pages_read_engagement';
export const FACEBOOK_PAGES_SHOW_LIST_SCOPE = 'pages_show_list';
export const FACEBOOK_PUBLIC_PROFILE_SCOPE = 'public_profile';

export const FACEBOOK_SCOPES = [
  FACEBOOK_ADS_MANAGEMENT_SCOPE,
  FACEBOOK_BUSINESS_MANAGEMENT_SCOPE,
  FACEBOOK_CATALOG_MANAGEMENT_SCOPE,
  FACEBOOK_EMAIL_SCOPE,
  FACEBOOK_PAGES_MANAGE_METADATA_SCOPE,
  FACEBOOK_PAGES_READ_ENGAGEMENT_SCOPE,
  FACEBOOK_PAGES_SHOW_LIST_SCOPE,
  FACEBOOK_PUBLIC_PROFILE_SCOPE
];

export interface FacebookBusinessAccount {
  id: string;
  name: string;
  verification_status: string;
  created_time: string;
  updated_time: string;
  business_type?: string;
  primary_page?: string;
}

export interface FacebookAdAccount {
  id: string;
  name: string;
  account_id: string;
  business_id?: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  business_name?: string;
  created_time: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  category?: string;
  category_list: { id: string; name: string }[];
  access_token?: string;
  perms?: string[];
  tasks?: string[];
  verification_status?: string;
  fan_count?: number;
}

export interface FacebookCatalog {
  id: string;
  name: string;
  business_id: string;
  product_count: number;
  created_time: string;
  updated_time: string;
}

export type FacebookBusinessPermission = 'ADMIN' | 'EMPLOYEE' | 'ADVERTISER';
export type FacebookPagePermission = 'ADMIN' | 'EDITOR' | 'MODERATOR' | 'ADVERTISER' | 'ANALYST';
export type FacebookAdAccountPermission = 'ADMIN' | 'GENERAL_USER' | 'REPORTS_ONLY';
export type FacebookCatalogPermission = 'ADMIN' | 'ADVERTISER';

export type FacebookServiceType = 'business' | 'adAccount' | 'page' | 'catalog';

export const FACEBOOK_BUSINESS_ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  ADVERTISER: 'ADVERTISER'
} as const;

export const FACEBOOK_PAGE_ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  MODERATOR: 'MODERATOR',
  ADVERTISER: 'ADVERTISER',
  ANALYST: 'ANALYST'
} as const;

export const FACEBOOK_AD_ACCOUNT_ROLES = {
  ADMIN: 'ADMIN',
  GENERAL_USER: 'GENERAL_USER',
  REPORTS_ONLY: 'REPORTS_ONLY'
} as const;

export const FACEBOOK_CATALOG_ROLES = {
  ADMIN: 'ADMIN',
  ADVERTISER: 'ADVERTISER'
} as const;

export const FACEBOOK_ERROR_CODES = {
  INVALID_TOKEN: 190,
  PERMISSIONS_ERROR: 200,
  USER_NOT_FOUND: 803,
  DUPLICATE_USER: 1487,
  RATE_LIMIT: 613,
  TEMPORARILY_BLOCKED: 368
} as const;

export interface FacebookCredentials {
  access_token: string;
}
