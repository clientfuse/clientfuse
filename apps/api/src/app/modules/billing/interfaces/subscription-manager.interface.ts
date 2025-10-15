import {
  ICustomerSubscription,
  ISubscriptionPlan,
  ISubscriptionResponse,
} from '@clientfuse/models';
import { Subscription } from '../schemas/subscription.schema';
import { SubscriptionPlan } from '../schemas/subscription-plan.schema';

/**
 * Subscription Manager Interface
 *
 * This interface defines the contract for subscription data management.
 * By depending on this abstraction, services can work with subscriptions
 * without knowing about the underlying storage mechanism.
 *
 * @example
 * // Current: SubscriptionService implements ISubscriptionManager (MongoDB)
 * // Future: PostgresSubscriptionService implements ISubscriptionManager
 * // BillingService remains unchanged
 */
export interface ISubscriptionManager {
  /**
   * Create a new subscription record in database
   */
  createSubscription(data: Partial<ICustomerSubscription>): Promise<Subscription>;

  /**
   * Get user's subscription with populated plan details
   * @returns null if user has no subscription
   */
  getSubscriptionByUserId(userId: string): Promise<ISubscriptionResponse | null>;

  /**
   * Get subscription by Stripe subscription ID
   * Used for webhook processing
   */
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null>;

  /**
   * Update subscription data (status, dates, etc.)
   */
  updateSubscription(
    stripeSubscriptionId: string,
    updates: Partial<ICustomerSubscription>
  ): Promise<Subscription>;

  /**
   * Get all active subscription plans for display
   */
  getActivePlans(): Promise<ISubscriptionPlan[]>;

  /**
   * Get specific plan by ID
   * @throws NotFoundException if plan doesn't exist
   */
  getPlanById(planId: string): Promise<SubscriptionPlan>;

  /**
   * Check if user has active paid subscription
   * Used for access control
   */
  hasActiveSubscription(userId: string): Promise<boolean>;
}
