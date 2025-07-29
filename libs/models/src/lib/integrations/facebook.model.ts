export type FacebookAccountStatus = 'ACTIVE' | 'DISABLED' | 'UNSETTLED';

export type FacebookAdAccountTask = 'DRAFT' | 'ANALYZE' | 'ADVERTISE' | 'MANAGE';
export type FacebookPageTask = 'ADVERTISE' | 'ANALYZE' | 'CREATE_CONTENT' | 'MESSAGING' | 'MODERATE' | 'MANAGE';

export type FacebookBusinessRole = 'ADMIN' | 'EMPLOYEE' | 'PARTNER';
export type TwoFactorStatus = 'enabled' | 'disabled';

export type FacebookService = 'ads' | 'pages' | 'instagram' | 'catalogs' | 'pixels';

export const FACEBOOK_SCOPES = [
  'ads_management',
  'business_management',
  'catalog_management',
  'email',
  'pages_manage_metadata',
  'pages_read_engagement',
  'pages_show_list',
  'public_profile'
];



