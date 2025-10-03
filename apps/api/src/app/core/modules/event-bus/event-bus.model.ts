/**
 * Event Type Naming Convention
 *
 * Pattern: {domain}.{entity}.{action}.{scope?}
 *
 * Rules:
 * 1. Use past tense for actions (registered, logged_in, updated, created, completed, etc.)
 * 2. Use dot notation for namespacing (domain.entity.action)
 * 3. Group events by domain (auth, user, integration, agency, connection_link)
 * 4. Add scope suffix when needed (.internal, .external, .via.{platform})
 * 5. Use underscores for multi-word actions (logged_in, accounts_data, etc.)
 *
 * Examples:
 * - auth.user.registered.via.google
 * - integration.google.connected.internal
 * - user.email.updated
 * - agency.created
 * - agency.google.check.completed
 *
 * Checklist before creating new event:
 * ✓ Name in past tense?
 * ✓ Follows {domain}.{entity}.{action} pattern?
 * ✓ Specific and understandable?
 * ✓ Uses consistent domain grouping?
 * ✓ Scope suffix added if needed?
 */
export enum EventType {
  AUTH_REGISTER_GOOGLE = 'auth.user.registered.via.google',
  AUTH_REGISTER_FACEBOOK = 'auth.user.registered.via.facebook',
  AUTH_LOGIN_GOOGLE = 'auth.user.logged_in.via.google',
  AUTH_LOGIN_FACEBOOK = 'auth.user.logged_in.via.facebook',
  USER_EMAIL_UPDATED = 'user.email.updated',
  USER_GOOGLE_ACCOUNTS_DATA_UPDATED = 'user.google.accounts_data.updated',
  USER_FACEBOOK_ACCOUNTS_DATA_UPDATED = 'user.facebook.accounts_data.updated',
  GOOGLE_DISCONNECTED_INTERNAL = 'integration.google.disconnected.internal',
  FACEBOOK_DISCONNECTED_INTERNAL = 'integration.facebook.disconnected.internal',
  GOOGLE_CONNECTED_INTERNAL = 'integration.google.connected.internal',
  FACEBOOK_CONNECTED_INTERNAL = 'integration.facebook.connected.internal',
  AGENCY_CREATED = 'agency.created',
  AGENCY_CHECKED_AFTER_GOOGLE_ACCOUNT_DATA_UPDATED = 'agency.google.check.completed',
  AGENCY_CHECKED_AFTER_FACEBOOK_ACCOUNT_DATA_UPDATED = 'agency.facebook.check.completed',
  AGENCIES_MERGED = 'agency.merge.completed',
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

export interface IUserEmailUpdatedEvent {
  userId: string;
}

export interface IGoogleAccountsDataUpdatedEvent {
  userId: string;
}

export interface IFacebookAccountsDataUpdatedEvent {
  userId: string;
}

export interface IIntegrationGoogleDisconnectedEvent {
  userId: string;
}

export interface IIntegrationFacebookDisconnectedEvent {
  userId: string;
}

export interface IAgencyCreatedEvent {
  agencyId: string;
  userId: string;
}

export interface IAgencyGoogleCheckCompletedEvent {
  agencyId: string;
  userId: string;
}

export interface IAgencyFacebookCheckCompletedEvent {
  agencyId: string;
  userId: string;
}

export interface IAgencyMergeCompletedEvent {
  allAgencyIds: string[];
  mergedAgencyId: string;
}

export interface IIntegrationGoogleConnectedEvent {
  userId: string;
}

export interface IIntegrationFacebookConnectedEvent {
  userId: string;
}
