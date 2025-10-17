import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IPaymentProvider } from '../../../core/modules/stripe/interfaces/payment-provider.interface';
import { PAYMENT_PROVIDER_TOKEN } from '../../../core/modules/stripe/constants/di-tokens.constant';
import { SubscriptionService } from './subscription.service';
import { User } from '../../users/schemas/users.schema';
import {
  ICreateCheckoutSessionRequest,
  ICreateCheckoutSessionResponse,
  ICreatePortalSessionRequest,
  ICreatePortalSessionResponse,
  ISubscriptionResponse,
  ISubscriptionPlan,
  SubscriptionStatus,
  TRIAL_PERIOD_DAYS,
} from '@clientfuse/models';

/**
 * Billing Service - Orchestrator for billing operations
 *
 * This service coordinates between StripeService (payment provider)
 * and SubscriptionService (data management).
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER_TOKEN) private paymentProvider: IPaymentProvider,
    private subscriptionService: SubscriptionService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createCheckoutSession(
    userId: string,
    dto: ICreateCheckoutSessionRequest,
  ): Promise<ICreateCheckoutSessionResponse> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const plan = await this.subscriptionService.getPlanById(dto.planId);

      const existingSubscription = await this.subscriptionService.getSubscriptionByUserId(userId);
      if (existingSubscription &&
          (existingSubscription.status === SubscriptionStatus.ACTIVE ||
           existingSubscription.status === SubscriptionStatus.TRIALING)) {
        throw new BadRequestException('User already has an active subscription');
      }

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.paymentProvider.createCustomer({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: userId,
          },
        });
        stripeCustomerId = customer.id;

        await this.userModel.findByIdAndUpdate(userId, {
          stripeCustomerId: stripeCustomerId,
        });
      }

      const hasHistory = await this.subscriptionService.hasSubscriptionHistory(userId);
      const trialPeriodDays = hasHistory ? undefined : TRIAL_PERIOD_DAYS;

      const session = await this.paymentProvider.createCheckoutSession({
        customerId: stripeCustomerId,
        customerEmail: user.email,
        priceId: plan.stripePriceId,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl,
        trialPeriodDays,
        metadata: {
          userId: userId,
          planId: dto.planId,
        },
      });

      this.logger.log(`Checkout session created for user ${userId}: ${session.id}`);

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create checkout session for user ${userId}`, error);
      throw error;
    }
  }

  async createPortalSession(
    userId: string,
    dto: ICreatePortalSessionRequest,
  ): Promise<ICreatePortalSessionResponse> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripeCustomerId) {
        throw new BadRequestException('User has no Stripe customer ID');
      }

      const session = await this.paymentProvider.createPortalSession({
        customerId: user.stripeCustomerId,
        returnUrl: dto.returnUrl,
      });

      this.logger.log(`Portal session created for user ${userId}`);

      return {
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create portal session for user ${userId}`, error);
      throw error;
    }
  }

  async getSubscription(userId: string): Promise<ISubscriptionResponse> {
    try {
      const subscription = await this.subscriptionService.getSubscriptionByUserId(userId);

      if (!subscription) {
        throw new NotFoundException('No subscription found for user');
      }

      return subscription;
    } catch (error) {
      this.logger.error(`Failed to get subscription for user ${userId}`, error);
      throw error;
    }
  }

  async getPlans(): Promise<ISubscriptionPlan[]> {
    try {
      return await this.subscriptionService.getActivePlans();
    } catch (error) {
      this.logger.error('Failed to get plans', error);
      throw error;
    }
  }

  async cancelSubscription(userId: string, cancelAtPeriodEnd = true): Promise<ISubscriptionResponse> {
    try {
      const subscription = await this.subscriptionService.getSubscriptionByUserId(userId);

      if (!subscription) {
        throw new NotFoundException('No subscription found for user');
      }

      await this.paymentProvider.cancelSubscription(
        subscription.stripeSubscriptionId,
        cancelAtPeriodEnd,
      );

      // Update will come via webhook
      this.logger.log(`Subscription cancellation initiated for user ${userId}`);

      return await this.subscriptionService.getSubscriptionByUserId(userId);
    } catch (error) {
      this.logger.error(`Failed to cancel subscription for user ${userId}`, error);
      throw error;
    }
  }
}
