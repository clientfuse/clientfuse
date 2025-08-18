export interface IAccessLinkBase {
  isViewAccessEnabled: boolean;
  isManageAccessEnabled: boolean;
}

export type TAccessLinkBaseKey = keyof IAccessLinkBase;
export type TAccessType = 'view' | 'manage';

export const getAccessLinkBaseKey = (accessType: TAccessType): TAccessLinkBaseKey => {
  switch (accessType) {
    case 'view':
      return 'isViewAccessEnabled';
    case 'manage':
      return 'isManageAccessEnabled';
    default:
      throw new Error(`Invalid access type: ${accessType}`);
  }
};

export const AccessTypeNames: Record<TAccessType, string> = {
  view: 'View',
  manage: 'Manage'
};

export type IGoogleAccessLinkWithEmail = IAccessLinkBase & {
  email: string;
}

export type IGoogleAccessLinkWithEmailOrId = IAccessLinkBase & {
  emailOrId: string;
}

export type TGoogleAccessLink = {
  ads: IGoogleAccessLinkWithEmail & { method: string };
  analytics: IGoogleAccessLinkWithEmail;
  merchantCenter: IGoogleAccessLinkWithEmail;
  myBusiness: IGoogleAccessLinkWithEmailOrId;
  searchConsole: IGoogleAccessLinkWithEmail;
  tagManager: IGoogleAccessLinkWithEmail;
}

export type TGoogleAccessLinkKeys = keyof TGoogleAccessLink;

export type TFacebookAccessLinkWithId = IAccessLinkBase & {
  entityId: string;
}

export type TFacebookAccessLink = {
  ads: TFacebookAccessLinkWithId;
  business: TFacebookAccessLinkWithId;
  pages: TFacebookAccessLinkWithId;
  catalogs: TFacebookAccessLinkWithId;
}

export type TFacebookAccessLinkKeys = keyof TFacebookAccessLink;

export type TAccessLink = {
  google?: TGoogleAccessLink;
  facebook?: TFacebookAccessLink;
  _id?: string;
}

export interface IAgencyBase {
  email: string;
  userId: string;
  defaultAccessLink: TAccessLink;
}

export const PlatformNames: Record<keyof Omit<TAccessLink, '_id'>, string> = {
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
  catalogs: 'Catalogs'
};

export type IAgencyResponse = IAgencyBase & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
