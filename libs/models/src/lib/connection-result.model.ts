import { IAgencyResponse, IFacebookInfo, IGoogleInfo, IGrantAccessResponse, TPlatformNamesKeys } from '@clientfuse/models';

export type TBaseConnectionResult = {
  agencyId: IAgencyResponse['_id'];
  connectionLinkId: string;
  googleUserId?: IGoogleInfo['userId'];
  facebookUserId?: IFacebookInfo['userId'];
  grantedAccesses: Record<TPlatformNamesKeys, IGrantAccessResponse[]>
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
