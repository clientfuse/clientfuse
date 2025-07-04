export enum EventType {
  AUTH_REGISTER_GOOGLE = 'auth.register.google',
  AUTH_REGISTER_FACEBOOK = 'auth.register.facebook',
  AUTH_LOGIN_GOOGLE = 'auth.login.google',
  AUTH_LOGIN_FACEBOOK = 'auth.login.facebook',
}

export interface IEmittedEvent<T> {
  timestamp: Date;
  source: string;
  type: EventType;
  payload: T;
  correlationId?: string | null;
}

export class EmittedEvent<T> implements IEmittedEvent<T> {
  timestamp: Date;
  source: string;
  type: EventType;
  payload: T;
  correlationId?: string | null;

  constructor(
    type: EventType,
    payload: T,
    source: string = 'API',
    correlationId?: string | null
  ) {
    this.timestamp = new Date();
    this.source = source;
    this.type = type;
    this.payload = payload;
    this.correlationId = correlationId || null;
  }
}

export interface IGoogleAuthEvent {
  userId: string;
  googleAccessToken: string;
  googleRefreshToken: string;
}

export interface IFacebookAuthEvent {
  userId: string;
  facebookAccessToken: string;
}
