/**
 * Trial period duration in days
 * Applied to all new subscriptions
 */
export const TRIAL_PERIOD_DAYS = 7;

/**
 * Subscription Status Enum
 * Based on Stripe.Subscription.Status type
 * Includes all possible statuses from Stripe API
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
  PAUSED = 'paused',
  TRIALING = 'trialing',
  UNPAID = 'unpaid'
}

export enum TierType {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold'
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  ANNUAL = 'annual'
}

/**
 * Subscription Plan Limits
 *
 * These limits define what features are available for each subscription tier.
 * They are enforced on the backend to prevent users from exceeding their plan limits.
 *
 * @property whiteLabeling - Whether white-labeling is available (Gold only)
 * @property agencyTeamMembers - Maximum number of team members allowed per agency
 * @property customConnectionLinks - Maximum number of custom connection links (excluding default ones)
 *
 * @example
 * Bronze: { whiteLabeling: false, agencyTeamMembers: 2, customConnectionLinks: 5 }
 * Silver: { whiteLabeling: false, agencyTeamMembers: 5, customConnectionLinks: 15 }
 * Gold: { whiteLabeling: true, agencyTeamMembers: 20, customConnectionLinks: 50 }
 */
export interface ISubscriptionPlanLimits {
  whiteLabeling: boolean;
  agencyTeamMembers: number;
  customConnectionLinks: number;
}

export interface ISubscriptionPlan {
  id: string;
  tierType: TierType;
  name: string;
  stripePriceId: string;
  stripeProductId: string;
  billingPeriod: BillingPeriod;
  price: number;
  currency: string;
  features: string[];
  limits: ISubscriptionPlanLimits;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerSubscription {
  id: string;
  userId: string; // Only user level - no agency level
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUsageRecord {
  id: string;
  subscriptionId: string;
  metricType: 'users' | 'agencies' | 'storage' | 'apiCalls';
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Request/Response types
export interface ICreateCheckoutSessionRequest {
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface ICreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface ICreatePortalSessionRequest {
  returnUrl: string;
}

export interface ICreatePortalSessionResponse {
  url: string;
}

export interface ISubscriptionResponse extends ICustomerSubscription {
  plan: ISubscriptionPlan;
  usage?: IUsageRecord[];
}
