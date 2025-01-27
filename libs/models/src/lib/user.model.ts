export interface IAccessToken {
  access_token: string;
}

export interface IJwtPayload {
  sub: IUserResponse;
  iat: number;
  exp: number;
}

export interface IRegistrationCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  registrationDate: number;
  phone: string | null;
  birthDate: string | null;
  lastSeenDate: number | null;
  googleUserId: string | null;
  googleAccessToken: string | null;
  googleGrantedScopes: string[];
  googleAdsAccounts: IGoogleAdsAccount[];
  googleTagManagerAccounts: IGoogleTagManagerAccount[];
  googleSearchConsoles: IGoogleSearchConsole[];
  googleMyBusinessAccounts: IGoogleMyBusinessAccount[];
  googleMerchantCenters: IGoogleMerchantCenter[];
  googleMyBusinessLocations: IGoogleMyBusinessLocation[];
  facebookUserId: string | null;
  facebookGrantedScopes: string[];
  facebookAccessToken: string | null;
  isLoggedInWithFacebook: boolean;
  isLoggedInWithGoogle: boolean;
}

export interface IGoogleAdsAccount {
  id: string;
  name: string;
  hasNoPermissions: boolean;
  _id: string;
}

export interface IGoogleAnaliticsAccount {
  id: string;
  name: string;
  created: string;
  selfLink: string;
  childLink: {
    type: string;
    href: string;
  };
  permissions: string[]; // 'COLLABORATE', 'EDIT', 'MANAGE_USERS', 'READ_AND_ANALYZE'
  _id: string;
}

export interface IGoogleTagManagerAccount {
  id: string;
  name: string;
  path: string;
  _id: string;
}

export interface IGoogleSearchConsole { // todo specify later
  siteUrl: string;
  permissionLevel: string;
  verified: boolean;
  _id: string;
}

export interface IGoogleMyBusinessAccount { // todo specify later
  id: string;
  name: string;
  accountType: string;
}

export interface IGoogleMerchantCenter { // todo specify later
  id: string;
  name: string;
  country: string;
}

export interface IGoogleMyBusinessLocation { // todo specify later
  id: string;
  name: string;
  address: string;
}

export interface IUserResponse extends Omit<IRegistrationCredentials, 'password'> {
  _id: string;
}

