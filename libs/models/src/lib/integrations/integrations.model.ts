import { AccessType } from '../connection-link.model';

export interface IBaseAccessRequest {
  entityId: string; // account/property/site ID etc.
  agencyIdentifier: string; // google email or facebook business ID etc.
  permissions: string[];
}

export interface IBaseUserInfo {
  linkId: string;
  email: string;
  permissions: string[];
  kind: string;
  selfLink?: string;
}

export interface IBaseGetEntityUsersParams {
  entityId: string;
  agencyId?: string; // internal agency id from DB
}

export interface IGetEntityUsersQueryDto {
  accessToken: string;
  agencyId?: string; // internal agency id from DB
}

export interface IGrantAgencyAccessDto {
  accessToken: string;
  service: string;
  entityId: string;
  agencyIdentifier: string; // google email or facebook business ID etc.
}

export interface IRevokeAgencyAccessDto {
  accessToken: string;
  service: string;
  entityId: string;
  linkId: string;
}

export interface IGrantAccessResponse {
  success: boolean;
  service: string;
  accessType: AccessType;
  entityId: string;
  agencyIdentifier: string;
  linkId?: string;
  message?: string;
  error?: string;
}

export interface IGetEntityUsersResponse {
  service: string;
  entityId: string;
  users: IBaseUserInfo[];
  totalUsers: number;
}

export interface IRevokeAccessResponse {
  success: boolean;
  service: string;
  message?: string;
  error?: string;
}
