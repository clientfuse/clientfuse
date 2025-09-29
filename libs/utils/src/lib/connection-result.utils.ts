import { TConnectionResultResponse, TPlatformNamesKeys } from '@clientfuse/models';
import { DateTime } from 'luxon';

// Mapping services to display names
export const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  // Google services - using prefix to avoid collisions
  'google-analytics': 'Google Analytics Account',
  'google-ads': 'Google Ads Account',
  'google-merchant-center': 'Google Merchant Center',
  'google-my-business': 'Google My Business',
  'google-search-console': 'Google Search Console',
  'google-tag-manager': 'Google Tag Manager',
  // Facebook services
  'facebook-ads': 'Meta Ad Account',
  'facebook-pages': 'Facebook Page',
  'facebook-catalogs': 'Facebook Catalog',
  'facebook-pixels': 'Meta Dataset'
};

// Mapping to icons
export const SERVICE_ICONS: Record<string, string> = {
  // Google services
  'google-analytics': './assets/icons/google-analytics.svg',
  'google-ads': './assets/icons/google-ads.svg',
  'google-merchant-center': './assets/icons/google-merchant-center.svg',
  'google-my-business': './assets/icons/google-my-business.svg',
  'google-search-console': './assets/icons/google-search-console.svg',
  'google-tag-manager': './assets/icons/google-tag-manager.svg',
  // Facebook services - using shared icons
  'facebook-ads': './assets/icons/meta.svg',
  'facebook-pages': './assets/icons/facebook.svg',
  'facebook-catalogs': './assets/icons/facebook.svg',
  'facebook-pixels': './assets/icons/meta.svg'
};

// Format relative time using luxon
export function formatRelativeTime(date: Date | string): string {
  const dateTime = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
  const diff = dateTime.diffNow();
  const absoluteDiff = Math.abs(diff.as('minutes'));

  if (absoluteDiff < 1) {
    return 'just now';
  } else if (absoluteDiff < 60) {
    const minutes = Math.floor(absoluteDiff);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (absoluteDiff < 1440) {
    const hours = Math.floor(absoluteDiff / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (absoluteDiff < 43200) {
    const days = Math.floor(absoluteDiff / 1440);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return dateTime.toLocaleString(DateTime.DATETIME_SHORT);
  }
}

// Generate deep links for platforms
export function generatePlatformDeepLink(
  platform: TPlatformNamesKeys,
  service: string,
  entityId: string,
  businessId?: string
): string {
  if (platform === 'facebook' && businessId) {
    // Base format for Facebook Business Manager
    const serviceMap: Record<string, string> = {
      'ads': 'ad_accounts',
      'pages': 'pages',
      'catalogs': 'product_catalogs',
      'pixels': 'events_dataset',
      'business': 'businesses'
    };

    const servicePath = serviceMap[service] || service;
    const assetType = service === 'pixels' ? 'events-dataset-new' : service;

    return `https://business.facebook.com/latest/settings/${servicePath}?business_id=${businessId}&selected_asset_id=${entityId}&selected_asset_type=${assetType}`;
  }

  // For Google, we need additional parameters like ocid which are not available
  // Return a placeholder or basic URL
  return '#';
}

// Detect platform(s) from connection result
export function detectPlatforms(result: TConnectionResultResponse): TPlatformNamesKeys[] {
  const platforms: TPlatformNamesKeys[] = [];

  if (result.googleUserId) {
    platforms.push('google');
  }

  if (result.facebookUserId) {
    platforms.push('facebook');
  }

  return platforms;
}

// Get platform display name
export function getPlatformDisplayName(platform: TPlatformNamesKeys): string {
  const platformNames: Record<TPlatformNamesKeys, string> = {
    google: 'Google',
    facebook: 'Facebook'
  };

  return platformNames[platform] || platform;
}

// Get service icon or fallback to platform icon
export function getServiceIcon(service: string, platform?: TPlatformNamesKeys): string {
  if (SERVICE_ICONS[service]) {
    return SERVICE_ICONS[service];
  }

  // Fallback to platform icons
  if (platform === 'google') {
    return './assets/icons/google.svg';
  } else if (platform === 'facebook') {
    return './assets/icons/meta.svg';
  }

  return '';
}

// Get service display name
export function getServiceDisplayName(service: string): string {
  // Try with platform prefix first
  const googlePrefixed = `google-${service}`;
  const facebookPrefixed = `facebook-${service}`;

  if (SERVICE_DISPLAY_NAMES[googlePrefixed]) {
    return SERVICE_DISPLAY_NAMES[googlePrefixed];
  }

  if (SERVICE_DISPLAY_NAMES[facebookPrefixed]) {
    return SERVICE_DISPLAY_NAMES[facebookPrefixed];
  }

  // Return service name with proper casing
  return service.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}