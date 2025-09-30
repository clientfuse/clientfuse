import { AccessType, FacebookServiceType, GoogleServiceType, TPlatformNamesKeys } from '@clientfuse/models';
import { UIVariant } from '../models/ui.model';

export const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  // Google services
  [GoogleServiceType.ANALYTICS]: 'Google Analytics',
  [GoogleServiceType.ADS]: 'Google Ads',
  [GoogleServiceType.MERCHANT_CENTER]: 'Google Merchant Center',
  [GoogleServiceType.MY_BUSINESS]: 'Google My Business',
  [GoogleServiceType.SEARCH_CONSOLE]: 'Google Search Console',
  [GoogleServiceType.TAG_MANAGER]: 'Google Tag Manager',
  // Facebook services
  [FacebookServiceType.AD_ACCOUNT]: 'Meta Ads',
  [FacebookServiceType.PAGE]: 'Facebook Page',
  [FacebookServiceType.CATALOG]: 'Facebook Catalog',
  [FacebookServiceType.PIXEL]: 'Meta Dataset',
  [FacebookServiceType.BUSINESS]: 'Meta Business'
};

export const SERVICE_SHORT_DISPLAY_NAMES: Record<string, string> = {
  // Google services
  [GoogleServiceType.ANALYTICS]: 'Analytics',
  [GoogleServiceType.ADS]: 'Ads',
  [GoogleServiceType.MERCHANT_CENTER]: 'Merchant Center',
  [GoogleServiceType.MY_BUSINESS]: 'My Business',
  [GoogleServiceType.SEARCH_CONSOLE]: 'Search Console',
  [GoogleServiceType.TAG_MANAGER]: 'Tag Manager',
  // Facebook services
  [FacebookServiceType.AD_ACCOUNT]: 'Ads',
  [FacebookServiceType.PAGE]: 'Page',
  [FacebookServiceType.CATALOG]: 'Catalog',
  [FacebookServiceType.PIXEL]: 'Dataset',
  [FacebookServiceType.BUSINESS]: 'Business'
};

export const PLATFORM_DISPLAY_NAMES: Record<TPlatformNamesKeys, string> = {
  google: 'Google',
  facebook: 'Meta'
};

export const ACCESS_TYPE_DISPLAY_NAMES: Record<AccessType, string> = {
  view: 'View-Only',
  manage: 'Manage'
};

export const ACCESS_TYPE_ICONS: Record<AccessType, string> = {
  [AccessType.VIEW]: 'visibility',
  [AccessType.MANAGE]: 'admin_panel_settings'
};

export const ACCESS_TYPE_MESSAGE_NAMES: Record<AccessType, string> = {
  [AccessType.VIEW]: 'View',
  [AccessType.MANAGE]: 'Management'
};

export const ACCESS_TYPE_BADGE_VARIANTS: Record<AccessType, UIVariant> = {
  [AccessType.VIEW]: 'info',
  [AccessType.MANAGE]: 'success'
};

export function getServiceDisplayName(service: string): string {
  return SERVICE_DISPLAY_NAMES[service] || service;
}

export function getServiceShortDisplayName(service: string): string {
  return SERVICE_SHORT_DISPLAY_NAMES[service] || service;
}

export function getPlatformDisplayName(platform: TPlatformNamesKeys): string {
  return PLATFORM_DISPLAY_NAMES[platform] || platform;
}

export function getAccessTypeDisplayName(accessType: AccessType): string {
  return ACCESS_TYPE_DISPLAY_NAMES[accessType] || accessType;
}


export function getAccessTypeIcon(accessType: AccessType): string {
  return ACCESS_TYPE_ICONS[accessType] || 'help_outline';
}

export function getAccessTypeMessageName(accessType: AccessType): string {
  return ACCESS_TYPE_MESSAGE_NAMES[accessType] || accessType;
}

export function getAccessTypeBadgeVariant(accessType: AccessType): UIVariant {
  return ACCESS_TYPE_BADGE_VARIANTS[accessType] || 'neutral';
}


