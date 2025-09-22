import { IBaseAccessRequest, IBaseUserInfo, IGrantAccessResponse, IRevokeAccessResponse } from './integrations.model';

export type TFacebookAccessResponse = IGrantAccessResponse & {
  requiresManualApproval?: boolean; // Facebook specific
  businessManagerUrl?: string; // Direct link for manual actions
}

export interface IFacebookBaseAccessService {
  setCredentials(tokens: { access_token: string }): void;

  grantManagementAccess(entityId: string, agencyBusinessPorfolioId: string): Promise<TFacebookAccessResponse>;

  grantViewAccess(entityId: string, agencyBusinessPorfolioId: string): Promise<TFacebookAccessResponse>;

  grantAgencyAccess(request: IBaseAccessRequest): Promise<TFacebookAccessResponse>;

  checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null>;

  getEntityUsers(entityId: string): Promise<IBaseUserInfo[]>;

  revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse>;

  validateRequiredScopes(grantedScopes: string[]): boolean;

  getRequiredScopes(): string[];
}

export enum FacebookTask {
  ADVERTISE = 'ADVERTISE',
  ANALYZE = 'ANALYZE',
  CREATE_CONTENT = 'CREATE_CONTENT',
  MESSAGING = 'MESSAGING',
  MODERATE = 'MODERATE',
  MANAGE = 'MANAGE'
}

export enum FacebookBusinessRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  PARTNER = 'PARTNER'
}

export enum FacebookBusinessVerificationStatus {
  VERIFIED = 'VERIFIED',
  NOT_VERIFIED = 'NOT_VERIFIED',
  PENDING = 'PENDING'
}

export enum FacebookAdAccountRole {
  ADMIN = 1001,
  ADVERTISER = 1002,
  ANALYST = 1003
}

export enum FacebookPageRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  MODERATOR = 'MODERATOR',
  ADVERTISER = 'ADVERTISER',
  ANALYST = 'ANALYST'
}

export enum FacebookCatalogRole {
  ADMIN = 'ADMIN',
  ADVERTISER = 'ADVERTISER'
}

export enum FacebookService {
  ADS = 'ads',
  PAGES = 'pages',
  INSTAGRAM = 'instagram',
  CATALOGS = 'catalogs',
  PIXELS = 'pixels'
}

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
  verification_status: FacebookBusinessVerificationStatus | string;
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
  tasks?: FacebookTask[] | string[];
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

export interface FacebookPixel {
  id: string;
  name: string;
  created_time: string;
  last_fired_time?: string;
  code?: string;
  owner_business_id?: string;
  owner_business_name?: string;
  owner_ad_account_id?: string;
  owner_ad_account_name?: string;
}

export enum FacebookBusinessPermission {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  ADVERTISER = 'ADVERTISER'
}

export enum FacebookPagePermission {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  MODERATOR = 'MODERATOR',
  ADVERTISER = 'ADVERTISER',
  ANALYST = 'ANALYST'
}

export enum FacebookAdAccountPermission {
  ADMIN = 'ADMIN',
  GENERAL_USER = 'GENERAL_USER',
  REPORTS_ONLY = 'REPORTS_ONLY'
}

export enum FacebookCatalogPermission {
  ADMIN = 'ADMIN',
  ADVERTISER = 'ADVERTISER'
}

export enum FacebookPixelPermission {
  ADMIN = 'ADMIN',
  ADVERTISER = 'ADVERTISER'
}

export enum FacebookServiceType {
  BUSINESS = 'business',
  AD_ACCOUNT = 'adAccount',
  PAGE = 'page',
  CATALOG = 'catalog',
  PIXEL = 'pixel'
}

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

export const FACEBOOK_CATALOG_TASKS = {
  MANAGE: 'MANAGE',
  ADVERTISE: 'ADVERTISE',
  MANAGE_AR: 'MANAGE_AR',
  AA_ANALYZE: 'AA_ANALYZE'
} as const;

export const FACEBOOK_PIXEL_ROLES = {
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

// DTO Interfaces
export interface IFacebookConnectionDto {
  accessToken: string;
}

// Response Types
export interface IFacebookConnectionResponse {
  user: {
    id: string;
    email: string;
  };
  hasValidTokens: boolean;
  requiresReauth: boolean;
  accounts: IFacebookAccountsData | null;
}

export interface IFacebookAccountsData {
  facebookAdAccounts: FacebookAdAccount[];
  facebookBusinessAccounts: FacebookBusinessAccount[];
  facebookPages: FacebookPage[];
  facebookCatalogs: FacebookCatalog[];
  facebookPixels: FacebookPixel[];
  grantedScopes: string[];
}
