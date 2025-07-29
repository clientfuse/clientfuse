export interface IGoogleAccessLinkBase {
  isViewAccessEnabled: boolean;
  isManageAccessEnabled: boolean;
}

export type IGoogleAccessLinkWithEmail = IGoogleAccessLinkBase & {
  email: string;
}

export type IGoogleAccessLinkWithEmailOrId = IGoogleAccessLinkBase & {
  emailOrId: string;
}

export type IGoogleAccessLink = {
  ads: IGoogleAccessLinkWithEmail & { method: string };
  analytics: IGoogleAccessLinkWithEmail;
  merchantCenter: IGoogleAccessLinkWithEmail;
  myBusiness: IGoogleAccessLinkWithEmailOrId;
  searchConsole: IGoogleAccessLinkWithEmail;
  tagManager: IGoogleAccessLinkWithEmail;
}

export type TGoogleAccessLinkKeys = keyof IGoogleAccessLink;

export interface IAgencyBase {
  email: string;
  userId: string;
  defaultAccessLink: {
    google: IGoogleAccessLink;
    facebook: {}; // todo specify type later
  };
}

export type IAgencyResponse = IAgencyBase & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
