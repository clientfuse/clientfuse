import { FacebookServiceType, GoogleServiceType, TPlatformNamesKeys } from '@clientfuse/models';

export const PLATFORM_ICONS: Record<TPlatformNamesKeys, string> = {
  google: './assets/icons/google.svg',
  facebook: './assets/icons/meta.svg'
};

export const SERVICE_ICONS: Record<string, string> = {
  // Google services
  [GoogleServiceType.ANALYTICS]: './assets/icons/google-analytics.svg',
  [GoogleServiceType.ADS]: './assets/icons/google-ads.svg',
  [GoogleServiceType.MERCHANT_CENTER]: './assets/icons/google-merchant-center.svg',
  [GoogleServiceType.MY_BUSINESS]: './assets/icons/google-my-business.svg',
  [GoogleServiceType.SEARCH_CONSOLE]: './assets/icons/google-search-console.svg',
  [GoogleServiceType.TAG_MANAGER]: './assets/icons/google-tag-manager.svg',
  // Facebook services
  [FacebookServiceType.AD_ACCOUNT]: './assets/icons/meta.svg',
  [FacebookServiceType.PAGE]: './assets/icons/facebook.svg',
  [FacebookServiceType.CATALOG]: './assets/icons/facebook.svg',
  [FacebookServiceType.PIXEL]: './assets/icons/meta.svg',
  [FacebookServiceType.BUSINESS]: './assets/icons/meta.svg'
};

export function getPlatformIcon(platform: TPlatformNamesKeys): string {
  return PLATFORM_ICONS[platform] || '';
}

export function getServiceIcon(service: string, platform?: TPlatformNamesKeys): string {
  if (SERVICE_ICONS[service]) {
    return SERVICE_ICONS[service];
  }

  if (platform) {
    return getPlatformIcon(platform);
  }

  return '';
}
