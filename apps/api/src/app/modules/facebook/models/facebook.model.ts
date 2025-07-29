// *** Created Facebook models following existing Google model patterns ***

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

// *** Facebook service-specific permission types ***
export type FacebookBusinessPermission = 'ADMIN' | 'EMPLOYEE' | 'ADVERTISER';
export type FacebookPagePermission = 'ADMIN' | 'EDITOR' | 'MODERATOR' | 'ADVERTISER' | 'ANALYST';
export type FacebookAdAccountPermission = 'ADMIN' | 'GENERAL_USER' | 'REPORTS_ONLY';
export type FacebookCatalogPermission = 'ADMIN' | 'ADVERTISER';

export type FacebookServiceType = 'business' | 'adAccount' | 'page' | 'catalog';

// *** Facebook Business Manager role mappings ***
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

// *** Facebook scope constants ***
export const FACEBOOK_SCOPES = {
  EMAIL: 'email',
  CATALOG_MANAGEMENT: 'catalog_management',
  PAGES_SHOW_LIST: 'pages_show_list',
  ADS_MANAGEMENT: 'ads_management',
  BUSINESS_MANAGEMENT: 'business_management',
  PAGES_READ_ENGAGEMENT: 'pages_read_engagement',
  PAGES_MANAGE_METADATA: 'pages_manage_metadata',
  PUBLIC_PROFILE: 'public_profile'
} as const;

// *** Required scopes by service type ***
export const FACEBOOK_REQUIRED_SCOPES_BY_SERVICE = {
  business: [FACEBOOK_SCOPES.BUSINESS_MANAGEMENT],
  adAccount: [FACEBOOK_SCOPES.ADS_MANAGEMENT],
  page: [FACEBOOK_SCOPES.PAGES_SHOW_LIST, FACEBOOK_SCOPES.PAGES_MANAGE_METADATA],
  catalog: [FACEBOOK_SCOPES.CATALOG_MANAGEMENT]
} as const;

// *** Facebook Graph API endpoints ***
export const FACEBOOK_ENDPOINTS = {
  BUSINESS_USERS: (businessId: string) => `/${businessId}/business_users`,
  PAGE_ROLES: (pageId: string) => `/${pageId}/roles`,
  AD_ACCOUNT_USERS: (adAccountId: string) => `/${adAccountId}/users`,
  CATALOG_COLLABORATORS: (catalogId: string) => `/${catalogId}/collaborators`
} as const;

// *** Facebook error codes ***
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
  expires_in?: number;
  token_type?: string;
}

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
  category: string;
  category_list: Array<{ id: string; name: string }>;
  access_token?: string;
  perms: string[];
  tasks: string[];
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
