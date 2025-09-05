import { TAccessType } from '../agency.model';

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

export interface IBaseGetEntityUsersParams {
  entityId: string;
  agencyId?: string;
}

export interface IGetEntityUsersQueryDto {
  accessToken: string;
  agencyId?: string;
}

export interface IGrantAgencyAccessDto {
  accessToken: string;
  service: string;
  entityId: string;
  agencyEmail: string;
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
  accessType: TAccessType;
  entityId: string;
  agencyEmail: string;
  linkId?: string;
  message?: string;
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
}
