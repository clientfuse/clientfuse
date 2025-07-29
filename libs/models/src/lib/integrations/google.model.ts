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
