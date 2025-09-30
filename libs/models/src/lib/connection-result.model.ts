import { IAgencyResponse, IFacebookInfo, IGoogleInfo, IGrantAccessResponse, TPlatformNamesKeys, AccessType, IFindOptions } from '@clientfuse/models';

export type TBaseConnectionResult = {
  agencyId: IAgencyResponse['_id'];
  connectionLinkId: string;
  googleUserId?: IGoogleInfo['userId'];
  facebookUserId?: IFacebookInfo['userId'];
  grantedAccesses: Record<TPlatformNamesKeys, IGrantAccessResponse[]>;
  accessType: AccessType;
}

export type TConnectionResultResponse = TBaseConnectionResult & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TConnectionResultFilter = {
  agencyId?: TBaseConnectionResult['agencyId'];
  connectionLinkId?: TBaseConnectionResult['connectionLinkId'];
  googleUserId?: TBaseConnectionResult['googleUserId'];
  facebookUserId?: TBaseConnectionResult['facebookUserId'];
}

export interface IConnectionResultFilterDto extends TConnectionResultFilter, IFindOptions {
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  fromDate?: Date;
  toDate?: Date;
  platform?: TPlatformNamesKeys | 'all';
  accessType?: AccessType;
}
