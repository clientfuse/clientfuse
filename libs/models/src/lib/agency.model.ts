export interface IAgencyBase {
  email: string;
  userId: string;
}

export type IAgencyResponse = IAgencyBase & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
