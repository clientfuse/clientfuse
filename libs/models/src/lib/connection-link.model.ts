export interface IConnectionLinkItemBase {
  isEnabled: boolean;
}

export type TAccessType = 'view' | 'manage';

export const AccessTypeNames: Record<TAccessType, string> = {
  view: 'View',
  manage: 'Manage'
};

export type IGoogleAccessLinkWithEmail = IConnectionLinkItemBase & {
  email: string;
}

export type IGoogleAccessLinkWithEmailOrId = IConnectionLinkItemBase & {
  emailOrId: string;
}

export type TGoogleConnectionLink = {
  googleAds: IGoogleAccessLinkWithEmail & { method: string };
  googleAnalytics: IGoogleAccessLinkWithEmail;
  googleMerchantCenter: IGoogleAccessLinkWithEmail;
  googleMyBusiness: IGoogleAccessLinkWithEmailOrId;
  googleSearchConsole: IGoogleAccessLinkWithEmail;
  googleTagManager: IGoogleAccessLinkWithEmail;
}

export type TGoogleAccessLinkKeys = keyof TGoogleConnectionLink;

export type TFacebookConnectionLinkWithId = IConnectionLinkItemBase & {
  businessPortfolioId: string;
}

export type TFacebookAccessLink = {
  facebookAds: TFacebookConnectionLinkWithId;
  facebookBusiness: TFacebookConnectionLinkWithId;
  facebookPages: TFacebookConnectionLinkWithId;
  facebookCatalogs: TFacebookConnectionLinkWithId;
  facebookPixels: TFacebookConnectionLinkWithId;
}

export type TFacebookAccessLinkKeys = keyof TFacebookAccessLink;

export type TConnectionLink = {
  google?: TGoogleConnectionLink;
  facebook?: TFacebookAccessLink;
}

export type TConnectionLinkBase = TConnectionLink & {
  name: string;
  isDefault: boolean;
  agencyId: string;
  type: TAccessType;
}

export type TConnectionLinkResponse = TConnectionLinkBase & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TPlatformNamesKeys = keyof TConnectionLink;

export const PlatformNames: Record<TPlatformNamesKeys, string> = {
  google: 'Google',
  facebook: 'Meta'
};

export type AllAccessLinkKeys = TGoogleAccessLinkKeys | TFacebookAccessLinkKeys;

export const ServiceNames: Record<AllAccessLinkKeys, string> = {
  googleAds: 'Ads',
  googleAnalytics: 'Analytics',
  googleMerchantCenter: 'Merchant Center',
  googleMyBusiness: 'My Business',
  googleSearchConsole: 'Search Console',
  googleTagManager: 'Tag Manager',
  facebookAds: 'Ads',
  facebookBusiness: 'Business',
  facebookPages: 'Pages',
  facebookCatalogs: 'Catalogs',
  facebookPixels: 'Pixels'
};

export function generateConnectionLinkName(type: TAccessType, includeDate: boolean = false): string {
  const baseName = `${type === 'view' ? 'View' : 'Manage'} Connection Link`;
  return includeDate ? `${baseName} ${new Date().toISOString()}` : baseName;
}
