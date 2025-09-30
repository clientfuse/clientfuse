import { GoogleServiceType } from './integrations/google.model';
import { FacebookServiceType } from './integrations/facebook.model';

export interface IConnectionLinkItemBase {
  isEnabled: boolean;
}

export enum AccessType {
  VIEW = 'view',
  MANAGE = 'manage'
}

export type IGoogleAccessLinkWithEmail = IConnectionLinkItemBase & {
  email: string;
}

export type IGoogleAccessLinkWithEmailOrId = IConnectionLinkItemBase & {
  emailOrId: string;
}

export type TGoogleConnectionLink = {
  [GoogleServiceType.ADS]: IGoogleAccessLinkWithEmail & { method: string };
  [GoogleServiceType.ANALYTICS]: IGoogleAccessLinkWithEmail;
  [GoogleServiceType.MERCHANT_CENTER]: IGoogleAccessLinkWithEmail;
  [GoogleServiceType.MY_BUSINESS]: IGoogleAccessLinkWithEmailOrId;
  [GoogleServiceType.SEARCH_CONSOLE]: IGoogleAccessLinkWithEmail;
  [GoogleServiceType.TAG_MANAGER]: IGoogleAccessLinkWithEmail;
}

export type TFacebookConnectionLinkWithId = IConnectionLinkItemBase & {
  businessPortfolioId: string;
}

export type TFacebookAccessLink = {
  [FacebookServiceType.AD_ACCOUNT]: TFacebookConnectionLinkWithId;
  [FacebookServiceType.BUSINESS]: TFacebookConnectionLinkWithId;
  [FacebookServiceType.PAGE]: TFacebookConnectionLinkWithId;
  [FacebookServiceType.CATALOG]: TFacebookConnectionLinkWithId;
  [FacebookServiceType.PIXEL]: TFacebookConnectionLinkWithId;
}

export type TConnectionLink = {
  google?: TGoogleConnectionLink;
  facebook?: TFacebookAccessLink;
}

export type TConnectionLinkBase = TConnectionLink & {
  name: string;
  isDefault: boolean;
  agencyId: string;
  type: AccessType;
}

export type TConnectionLinkResponse = TConnectionLinkBase & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TPlatformNamesKeys = keyof TConnectionLink;

export function generateConnectionLinkName(type: AccessType, includeDate: boolean = false): string {
  const baseName = `${type === AccessType.VIEW ? 'View' : 'Manage'} Connection Link`;
  return includeDate ? `${baseName} ${new Date().toISOString()}` : baseName;
}
