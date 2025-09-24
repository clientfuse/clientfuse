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
  ads: IGoogleAccessLinkWithEmail & { method: string };
  analytics: IGoogleAccessLinkWithEmail;
  merchantCenter: IGoogleAccessLinkWithEmail;
  myBusiness: IGoogleAccessLinkWithEmailOrId;
  searchConsole: IGoogleAccessLinkWithEmail;
  tagManager: IGoogleAccessLinkWithEmail;
}

export type TGoogleAccessLinkKeys = keyof TGoogleConnectionLink;

export type TFacebookConnectionLinkWithId = IConnectionLinkItemBase & {
  businessPortfolioId: string;
}

export type TFacebookAccessLink = {
  ads: TFacebookConnectionLinkWithId;
  business: TFacebookConnectionLinkWithId;
  pages: TFacebookConnectionLinkWithId;
  catalogs: TFacebookConnectionLinkWithId;
  pixels: TFacebookConnectionLinkWithId;
}

export type TFacebookAccessLinkKeys = keyof TFacebookAccessLink;

export type TConnectionLink = {
  google?: TGoogleConnectionLink;
  facebook?: TFacebookAccessLink;
}

export type TConnectionLinkBase = TConnectionLink & {
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
  ads: 'Ads',
  analytics: 'Analytics',
  merchantCenter: 'Merchant Center',
  myBusiness: 'My Business',
  searchConsole: 'Search Console',
  tagManager: 'Tag Manager',
  business: 'Business',
  pages: 'Pages',
  catalogs: 'Catalogs',
  pixels: 'Pixels'
};
