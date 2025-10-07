export interface IWhiteLabelingConfig {
  agencyName: string | null;
  agencyLogo: string | null;
}

export interface IAgencyBase {
  email: string;
  userId: string;
  whiteLabeling: IWhiteLabelingConfig;
}

export type IAgencyResponse = IAgencyBase & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
