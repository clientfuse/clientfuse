import { FacebookServiceType, GoogleServiceType, AccessType, TPlatformNamesKeys } from '@clientfuse/models';

export const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  // Google services
  [GoogleServiceType.ANALYTICS]: 'Google Analytics',
  [GoogleServiceType.ADS]: 'Google Ads',
  [GoogleServiceType.MERCHANT_CENTER]: 'Google Merchant Center',
  [GoogleServiceType.MY_BUSINESS]: 'Google My Business',
  [GoogleServiceType.SEARCH_CONSOLE]: 'Google Search Console',
  [GoogleServiceType.TAG_MANAGER]: 'Google Tag Manager',
  // Facebook services
  [FacebookServiceType.AD_ACCOUNT]: 'Meta Ad',
  [FacebookServiceType.PAGE]: 'Facebook Page',
  [FacebookServiceType.CATALOG]: 'Facebook Catalog',
  [FacebookServiceType.PIXEL]: 'Meta Dataset',
  [FacebookServiceType.BUSINESS]: 'Meta Business'
};

export const PLATFORM_DISPLAY_NAMES: Record<TPlatformNamesKeys, string> = {
  google: 'Google',
  facebook: 'Meta'
};

export const ACCESS_TYPE_DISPLAY_NAMES: Record<AccessType, string> = {
  view: 'View-Only',
  manage: 'Manage'
};

export function getServiceDisplayName(service: string): string {
  if (SERVICE_DISPLAY_NAMES[service]) {
    return SERVICE_DISPLAY_NAMES[service];
  }

  return service.split(/(?=[A-Z])/).map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function getPlatformDisplayName(platform: TPlatformNamesKeys): string {
  return PLATFORM_DISPLAY_NAMES[platform] || platform;
}

export function getAccessTypeDisplayName(accessType: AccessType): string {
  return ACCESS_TYPE_DISPLAY_NAMES[accessType] || accessType;
}
