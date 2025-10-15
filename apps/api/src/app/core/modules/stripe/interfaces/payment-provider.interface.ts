import Stripe from 'stripe';

/**
 * Payment Provider Interface
 *
 * This interface defines the contract for any payment provider integration.
 * By depending on this abstraction instead of concrete Stripe implementation,
 * we can easily swap providers or add new ones without changing business logic.
 *
 * @example
 * // Current: StripeService implements IPaymentProvider
 * // Future: PayPalService implements IPaymentProvider
 * // Business logic (BillingService) remains unchanged
 */
export interface IPaymentProvider {
  /**
   * Create a checkout session for payment collection
   * @returns Session with URL to redirect user
   */
  createCheckoutSession(params: {
    customerId?: string;
    customerEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
  }): Promise<ICheckoutSession>;

  /**
   * Create a customer portal session for subscription management
   * @returns Portal session with URL
   */
  createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<IPortalSession>;

  /**
   * Create a customer in the payment provider
   * @returns Customer with ID
   */
  createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<ICustomer>;

  /**
   * Retrieve subscription details from payment provider
   */
  retrieveSubscription(subscriptionId: string): Promise<IProviderSubscription>;

  /**
   * Cancel a subscription
   * @param cancelAtPeriodEnd - If true, subscription cancels at end of period
   */
  cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean): Promise<IProviderSubscription>;

  /**
   * Verify webhook signature to ensure authenticity
   * @throws Error if signature is invalid
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): IWebhookEvent;
}

// Generic interfaces that work with any payment provider
export interface ICheckoutSession {
  id: string;
  url: string;
}

export interface IPortalSession {
  url: string;
}

export interface ICustomer {
  id: string;
  email: string;
}

export interface IProviderSubscription {
  id: string;
  customerId: string;
  status: string;
  currentPeriodStart: number; // Unix timestamp in seconds
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt?: number;
}

export interface IWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}
