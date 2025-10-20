import { secToMs } from '@clientfuse/utils';
import Stripe from 'stripe';

/**
 * Converts a Stripe timestamp (in seconds) to a JavaScript Date object.
 * Returns null if the timestamp is invalid or not provided.
 *
 * @param timestamp - Stripe timestamp in seconds (Unix timestamp)
 * @returns Date object or null
 */
export function convertStripeTimestamp(timestamp: number | undefined | null): Date | null {
  if (!timestamp || typeof timestamp !== 'number' || isNaN(timestamp)) {
    return null;
  }
  return new Date(secToMs(timestamp));
}

/**
 * Extracts the current period start and end timestamps from a Stripe subscription.
 * Handles both trialing and active subscriptions by checking subscription items.
 *
 * @param subscription - Stripe subscription object
 * @returns Object with currentPeriodStart and currentPeriodEnd as Unix timestamps (seconds) or undefined
 */
export function extractPeriodTimestamps(subscription: Stripe.Subscription): {
  currentPeriodStart: number | undefined;
  currentPeriodEnd: number | undefined;
} {
  if (subscription.status === 'trialing' && subscription.trial_start && subscription.trial_end) {
    return {
      currentPeriodStart: subscription.trial_start,
      currentPeriodEnd: subscription.trial_end
    };
  }

  const firstItem = subscription.items?.data?.[0] as Stripe.SubscriptionItem | undefined;
  if (firstItem?.current_period_start && firstItem?.current_period_end) {
    return {
      currentPeriodStart: firstItem.current_period_start,
      currentPeriodEnd: firstItem.current_period_end
    };
  }

  return {
    currentPeriodStart: undefined,
    currentPeriodEnd: undefined
  };
}

/**
 * Extracts the current period start and end dates from a Stripe subscription.
 * Handles both trialing and active subscriptions by checking subscription items.
 *
 * @param subscription - Stripe subscription object
 * @returns Object with currentPeriodStart and currentPeriodEnd as Date objects or null
 */
export function extractPeriodDates(subscription: Stripe.Subscription): {
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
} {
  const { currentPeriodStart, currentPeriodEnd } = extractPeriodTimestamps(subscription);

  return {
    currentPeriodStart: convertStripeTimestamp(currentPeriodStart),
    currentPeriodEnd: convertStripeTimestamp(currentPeriodEnd)
  };
}
