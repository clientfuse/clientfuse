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
  customerId?: string;
  currencyCode?: string;
  timeZone?: string;
  _id: string;
}
