import { ApiEnv } from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { IPaymentProvider, ICheckoutSession, IPortalSession, ICustomer, IProviderSubscription, IWebhookEvent } from './interfaces/payment-provider.interface';

/**
 * Stripe Service - Payment Provider Implementation
 *
 * This service wraps the Stripe SDK and implements the IPaymentProvider interface.
 * It handles all direct Stripe API calls and converts Stripe objects to generic interfaces.
 *
 * Located in core/ because it's reusable across multiple modules.
 */
@Injectable()
export class StripeService implements IPaymentProvider {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>(ApiEnv.STRIPE_SECRET_KEY);

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });
  }

  async createCheckoutSession(params: {
    customerId?: string;
    customerEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
  }): Promise<ICheckoutSession> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: params.customerId,
        customer_email: params.customerId ? undefined : params.customerEmail,
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
        subscription_data: {
          metadata: params.metadata,
          trial_period_days: params.trialPeriodDays,
        },
      });

      this.logger.log(`Checkout session created: ${session.id}`);

      return {
        id: session.id,
        url: session.url!,
      };
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);
      throw error;
    }
  }

  async createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<IPortalSession> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });

      this.logger.log(`Portal session created for customer: ${params.customerId}`);

      return {
        url: session.url,
      };
    } catch (error) {
      this.logger.error('Failed to create portal session', error);
      throw error;
    }
  }

  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<ICustomer> {
    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      });

      this.logger.log(`Customer created: ${customer.id}`);

      return {
        id: customer.id,
        email: customer.email!,
      };
    } catch (error) {
      this.logger.error('Failed to create customer', error);
      throw error;
    }
  }

  async retrieveSubscription(subscriptionId: string): Promise<IProviderSubscription> {
    try {
      const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
      // Stripe API returns these fields but TypeScript definitions may not be complete
      const subData = sub as any;

      return {
        id: sub.id,
        customerId: sub.customer as string,
        status: sub.status,
        currentPeriodStart: subData.current_period_start || sub.billing_cycle_anchor,
        currentPeriodEnd: subData.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        cancelAt: subData.cancel_at || undefined,
        canceledAt: sub.canceled_at || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve subscription: ${subscriptionId}`, error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<IProviderSubscription> {
    try {
      let sub: Stripe.Subscription;

      if (cancelAtPeriodEnd) {
        sub = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        sub = await this.stripe.subscriptions.cancel(subscriptionId);
      }

      // Stripe API returns these fields but TypeScript definitions may not be complete
      const subData = sub as any;

      return {
        id: sub.id,
        customerId: sub.customer as string,
        status: sub.status,
        currentPeriodStart: subData.current_period_start || sub.billing_cycle_anchor,
        currentPeriodEnd: subData.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        cancelAt: subData.cancel_at || undefined,
        canceledAt: sub.canceled_at || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${subscriptionId}`, error);
      throw error;
    }
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): IWebhookEvent {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, secret);

      return {
        id: event.id,
        type: event.type,
        data: event.data,
      };
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw error;
    }
  }

  /**
   * Get raw Stripe instance for advanced operations
   * Only use when absolutely necessary
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}
