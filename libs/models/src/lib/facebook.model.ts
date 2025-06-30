import { IEncryptedTokens } from './google.model';

export type FacebookAccountStatus = 'ACTIVE' | 'DISABLED' | 'UNSETTLED';

export type FacebookAdAccountTask = 'DRAFT' | 'ANALYZE' | 'ADVERTISE' | 'MANAGE';
export type FacebookPageTask = 'ADVERTISE' | 'ANALYZE' | 'CREATE_CONTENT' | 'MESSAGING' | 'MODERATE' | 'MANAGE';

export type FacebookBusinessRole = 'ADMIN' | 'EMPLOYEE' | 'PARTNER';
export type TwoFactorStatus = 'enabled' | 'disabled';

export type FacebookService = 'ads' | 'pages' | 'instagram' | 'catalogs' | 'pixels';

export interface IFacebookAdAccount {
  id: string;
  name: string;
  accountStatus: FacebookAccountStatus;
  currency: string;
  timeZone?: string;
  businessId?: string;
  businessName?: string;
  tasks: FacebookAdAccountTask[];
  _id: string;
}

export interface IFacebookPage {
  id: string;
  name: string;
  category?: string;
  tasks: FacebookPageTask[];
  accessToken?: string;
  businessId?: string;
  businessName?: string;
  instagramBusinessAccount?: {
    id: string;
    username: string;
  };
  _id: string;
}

export interface IFacebookBusiness {
  id: string;
  name: string;
  businessRole: FacebookBusinessRole;
  businessAdmins: string[];
  businessUsers: IFacebookBusinessUser[];
  businessAgencies: string[];
  businessUserTwoFactorStatus?: TwoFactorStatus;
  businessTwoFactorType?: string;
  _id: string;
}

export interface IFacebookBusinessUser {
  id: string;
  name: string;
  role: FacebookBusinessRole;
  _id: string;
}

export interface IFacebookInstagramAccount {
  id: string;
  name: string;
  username: string;
  businessId?: string;
  businessName?: string;
  _id: string;
}

export interface IFacebookCatalog {
  id: string;
  name: string;
  businessId?: string;
  productCount?: number;
  _id: string;
}

export interface IFacebookPixel {
  id: string;
  name: string;
  businessId?: string;
  businessName?: string;
  _id: string;
}

export interface IFacebookServiceSettings {
  enabled: boolean;
  mainBusinessManagerId: string | null;
  mainBusinessManagerName: string | null;

  autoAssignUsers: IFacebookBusinessUser[];

  defaultServices: {
    ads: boolean;
    pages: boolean;
    instagram: boolean;
    catalogs: boolean;
    pixels: boolean;
  };

  managePermissions: {
    ads: boolean;
    pages: boolean;
    instagram: boolean;
    catalogs: boolean;
    pixels: boolean;
  };

  // *** OAuth Configuration ***
  oauthScopes: {
    view: string[];
    manage: string[];
  };
}

export interface IFacebookIntegration {
  tokens: IEncryptedTokens;
  grantedScopes: string[];
  accounts: {
    adAccounts: IFacebookAdAccount[];
    pages: IFacebookPage[];
    businesses: IFacebookBusiness[];
    instagram: IFacebookInstagramAccount[];
    catalogs: IFacebookCatalog[];
    pixels: IFacebookPixel[];
  };
  lastSuccessfulCalls: Record<string, Date>;
  lastErrors: Record<string, string>;
}

export const FACEBOOK_OAUTH_SCOPES = {
  VIEW: [
    'email',
    'public_profile',
    'pages_read_engagement'
  ],
  MANAGE: [
    'email',
    'public_profile',
    'ads_management',
    'business_management',
    'catalog_management',
    'pages_manage_metadata',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_manage_insights'
  ]
} as const;

export interface IFacebookApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface IFacebookAccountListResponse {
  adAccounts: IFacebookAdAccount[];
  pages: IFacebookPage[];
  businesses: IFacebookBusiness[];
  instagram: IFacebookInstagramAccount[];
  catalogs: IFacebookCatalog[];
  pixels: IFacebookPixel[];
}

export interface IFacebookPlatformConfig {
  enabled: boolean;
  services: FacebookService[];
}

export interface IFacebookConnectionData {
  platform: 'facebook';
  accessLevel: 'view' | 'manage';
  tokens: IEncryptedTokens;
  grantedScopes: string[];
  selectedAccounts: Partial<IFacebookAccountListResponse>;
}

export interface IFacebookBusinessManagerRequest {
  businessId: string;
  businessName: string;
  requestedAssets: {
    adAccounts: string[];
    pages: string[];
    catalogs: string[];
    pixels: string[];
  };
  accessLevel: 'view' | 'manage';
}

export interface IFacebookBusinessManagerResponse {
  success: boolean;
  businessId: string;
  grantedAssets: {
    adAccounts: IFacebookAdAccount[];
    pages: IFacebookPage[];
    catalogs: IFacebookCatalog[];
    pixels: IFacebookPixel[];
  };
  pendingAssets: string[];
  rejectedAssets: string[];
}
