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
  phone?: string | null;
  birthDate?: string | null;
  lastSeenDate?: number | null;
  googleId?: string | null;
}

export interface IUserResponse extends Omit<IRegistrationCredentials, 'password'> {
  _id: string;
}

