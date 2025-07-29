export interface ICustomAccessOptions {
  entityId: string;
  agencyEmail: string;
  permissions: string[];
  notifyUser?: boolean;
  customMessage?: string;
  expirationDate?: Date;

  // Service-specific options (will be extended by each service)
  accountId?: string;
  propertyId?: string, // Analytics specific
  viewId?: string, // Analytics specific
  containerId?: string, // GTM specific
  locationName?: string, // My Business specific
  specificLocations?: string[]; // My Business specific
  propertyType?: string; // Search Console specific
  verificationMethod?: string; // Search Console specific
  workspaceId?: string; // Tag Manager specific
}

export interface IBaseAccessRequest {
  entityId: string; // account/property/site ID etc.
  agencyEmail: string;
  permissions: string[];
}

export interface IBaseAccessResponse {
  success: boolean;
  linkId?: string;
  entityId?: string;
  message?: string;
  error?: string;
}

export interface IBaseUserInfo {
  linkId: string;
  email: string;
  permissions: string[];
  kind: string;
  selfLink?: string;
}

export interface IGoogleBaseAccessService {
  setCredentials(tokens: { access_token?: string; refresh_token?: string }): void;

  grantManagementAccess(entityId: string, agencyEmail: string): Promise<IBaseAccessResponse>;

  grantReadOnlyAccess(entityId: string, agencyEmail: string): Promise<IBaseAccessResponse>;

  grantAgencyAccess(request: IBaseAccessRequest): Promise<IBaseAccessResponse>;

  grantCustomAccess(options: ICustomAccessOptions): Promise<IBaseAccessResponse>;

  checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null>;

  getEntityUsers(entityId: string): Promise<IBaseUserInfo[]>;

  revokeUserAccess(entityId: string, linkId: string): Promise<IBaseAccessResponse>;

  validateRequiredScopes(grantedScopes: string[]): boolean;

  getDefaultAgencyPermissions(): string[];

  getAllAvailablePermissions(): string[];

  getRequiredScopes(): string[];
}

// *** Service-specific permission types ***
export type GoogleAnalyticsPermission = 'COLLABORATE' | 'EDIT' | 'MANAGE_USERS' | 'READ_AND_ANALYZE';
export type GoogleAdsPermission = 'ADMIN' | 'STANDARD' | 'READ_ONLY' | 'EMAIL_ONLY';
export type GoogleTagManagerPermission = 'read' | 'edit' | 'delete' | 'publish';
export type GoogleSearchConsolePermission = 'FULL' | 'RESTRICTED';
export type GoogleMerchantCenterPermission = 'ADMIN' | 'STANDARD';
export type GoogleMyBusinessPermission = 'OWNER' | 'MANAGER' | 'SITE_MANAGER';

export type GoogleServiceType = 'analytics' | 'ads' | 'tagManager' | 'searchConsole' | 'merchantCenter' | 'myBusiness';

