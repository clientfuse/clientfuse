export type GoogleAnalyticsPermission = 'COLLABORATE' | 'EDIT' | 'MANAGE_USERS' | 'READ_AND_ANALYZE';

export type GoogleSearchConsolePermission = 'FULL' | 'RESTRICTED';
export type GoogleSiteType = 'SITE' | 'DOMAIN';
export type GoogleMyBusinessAccountType = 'PERSONAL' | 'BUSINESS';
export type GoogleVerificationState = 'VERIFIED' | 'UNVERIFIED';
export type GoogleAnalyticsType = 'GA4' | 'Universal';

export type GoogleService = 'analytics' | 'ads' | 'tagManager' | 'searchConsole' | 'myBusiness' | 'merchantCenter';

export interface IGoogleAdsAccount {
  id: string;
  name: string;
  hasNoPermissions: boolean;
  customerId?: string; // *** Google Ads Customer ID ***
  currencyCode?: string;
  timeZone?: string;
  _id: string;
}

export interface IGoogleAnaliticsAccount {
  id: string;
  name: string;
  created: string;
  selfLink: string;
  childLink: {
    type: string;
    href: string;
  };
  permissions: GoogleAnalyticsPermission[];
  accountType?: GoogleAnalyticsType;
  properties?: IGoogleAnalyticsProperty[];
  _id: string;
}

export interface IGoogleAnalyticsProperty {
  id: string;
  name: string;
  websiteUrl?: string;
  industryCategory?: string;
  defaultView?: string;
  _id: string;
}

export interface IGoogleTagManagerAccount {
  id: string;
  name: string;
  path: string;
  containers?: IGoogleTagManagerContainer[];
  _id: string;
}

export interface IGoogleTagManagerContainer {
  id: string;
  name: string;
  publicId: string; // *** GTM-XXXXXX ***
  usageContext: string[];
  _id: string;
}

export interface IGoogleSearchConsole {
  siteUrl: string;
  permissionLevel: GoogleSearchConsolePermission;
  verified: boolean;
  siteType?: GoogleSiteType;
  _id: string;
}

export interface IGoogleMyBusinessAccount {
  id: string;
  name: string;
  accountType: GoogleMyBusinessAccountType;
  role?: string;
  state?: GoogleVerificationState;
  _id: string;
}

export interface IGoogleMerchantCenter {
  id: string;
  name: string;
  country: string;
  websiteUrl?: string;
  businessInformation?: {
    address: string;
    phoneNumber: string;
  };
  _id: string;
}

export interface IGoogleMyBusinessLocation {
  id: string;
  name: string;
  address: string;
  phoneNumber?: string;
  websiteUrl?: string;
  placeId?: string;
  _id: string;
}


export interface IGoogleServiceSettings {
  analyticsEmail: string;
  adsEmail: string;
  tagManagerEmail: string;
  searchConsoleEmail: string;
  myBusinessEmail: string;
  merchantCenterEmail: string;

  defaultServices: {
    analytics: boolean;
    ads: boolean;
    tagManager: boolean;
    searchConsole: boolean;
    myBusiness: boolean;
    merchantCenter: boolean;
  };

  managePermissions: {
    analytics: boolean;
    ads: boolean;
    tagManager: boolean;
    searchConsole: boolean;
    myBusiness: boolean;
    merchantCenter: boolean;
  };

  oauthScopes: {
    view: string[];
    manage: string[];
  };
}


export interface IGoogleIntegration {
  tokens: IEncryptedTokens;
  grantedScopes: string[];
  accounts: {
    analytics: IGoogleAnaliticsAccount[];
    ads: IGoogleAdsAccount[];
    tagManager: IGoogleTagManagerAccount[];
    searchConsole: IGoogleSearchConsole[];
    myBusiness: IGoogleMyBusinessAccount[];
    merchantCenter: IGoogleMerchantCenter[];
  };
  lastSuccessfulCalls: Record<string, Date>;
  lastErrors: Record<string, string>;
}

export interface IEncryptedTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;

  // *** Token metadata ***
  issuedAt: Date;
  scope: string;

  // *** Refresh tracking ***
  lastRefreshed?: Date;
  refreshAttempts: number;
  refreshErrors: string[];
}

export const GOOGLE_OAUTH_SCOPES = {
  VIEW: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/tagmanager.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly'
  ],
  MANAGE: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/analytics.edit',
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/tagmanager.manage.users',
    'https://www.googleapis.com/auth/content',
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/webmasters'
  ]
} as const;

export interface IGoogleApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface IGoogleAccountListResponse {
  analytics: IGoogleAnaliticsAccount[];
  ads: IGoogleAdsAccount[];
  tagManager: IGoogleTagManagerAccount[];
  searchConsole: IGoogleSearchConsole[];
  myBusiness: IGoogleMyBusinessAccount[];
  merchantCenter: IGoogleMerchantCenter[];
}

export interface IGooglePlatformConfig {
  enabled: boolean;
  services: GoogleService[];
}

export interface IGoogleConnectionData {
  platform: 'google';
  accessLevel: 'view' | 'manage';
  tokens: IEncryptedTokens;
  grantedScopes: string[];
  selectedAccounts: Partial<IGoogleAccountListResponse>;
}
