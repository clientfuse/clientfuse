import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatus } from '@clientfuse/models';
import { secToMs } from '@clientfuse/utils';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private subscriptionService: SubscriptionService,
  ) {}

  async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process webhook event: ${event.type}`, error);
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    this.logger.log(`Checkout completed: ${session.id}`);

    const subscriptionId = session.subscription as string;
    const userId = session.metadata?.userId;

    if (!userId) {
      this.logger.warn('No userId in checkout session metadata');
      return;
    }

    // Subscription will be handled by customer.subscription.created event
    this.logger.log(`Subscription ${subscriptionId} will be created via webhook`);
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription created: ${subscription.id}`);

    const userId = subscription.metadata?.userId;
    const planId = subscription.metadata?.planId;

    if (!userId || !planId) {
      this.logger.warn('Missing userId or planId in subscription metadata');
      return;
    }

    // Stripe API returns these fields but TypeScript definitions may not be complete
    const subData = subscription as any;

    await this.subscriptionService.createSubscription({
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      planId,
      status: subscription.status as SubscriptionStatus,
      // Use secToMs utility for Stripe timestamps (they're in seconds)
      currentPeriodStart: new Date(secToMs(subData.current_period_start)),
      currentPeriodEnd: new Date(secToMs(subData.current_period_end)),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialStart: subscription.trial_start ? new Date(secToMs(subscription.trial_start)) : undefined,
      trialEnd: subscription.trial_end ? new Date(secToMs(subscription.trial_end)) : undefined,
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription updated: ${subscription.id}`);

    // Stripe API returns these fields but TypeScript definitions may not be complete
    const subData = subscription as any;

    await this.subscriptionService.updateSubscription(subscription.id, {
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(secToMs(subData.current_period_start)),
      currentPeriodEnd: new Date(secToMs(subData.current_period_end)),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(secToMs(subscription.canceled_at)) : undefined,
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription deleted: ${subscription.id}`);

    await this.subscriptionService.updateSubscription(subscription.id, {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice paid: ${invoice.id}`);

    // Stripe API returns subscription field but TypeScript definitions may not be complete
    const invoiceData = invoice as any;

    if (invoiceData.subscription) {
      const subscriptionId = typeof invoiceData.subscription === 'string'
        ? invoiceData.subscription
        : invoiceData.subscription.id;
      const subscription = await this.subscriptionService.getSubscriptionByStripeId(subscriptionId);

      if (subscription && subscription.status === SubscriptionStatus.PAST_DUE) {
        await this.subscriptionService.updateSubscription(subscriptionId, {
          status: SubscriptionStatus.ACTIVE,
        });
      }
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);

    // Stripe API returns subscription field but TypeScript definitions may not be complete
    const invoiceData = invoice as any;

    if (invoiceData.subscription) {
      const subscriptionId = typeof invoiceData.subscription === 'string'
        ? invoiceData.subscription
        : invoiceData.subscription.id;
      await this.subscriptionService.updateSubscription(subscriptionId, {
        status: SubscriptionStatus.PAST_DUE,
      });
    }
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Trial will end: ${subscription.id}`);
    // TODO: Send email notification to user about trial ending
  }
}
