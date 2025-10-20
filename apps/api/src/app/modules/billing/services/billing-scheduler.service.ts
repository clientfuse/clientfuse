import { ICustomerSubscription, SubscriptionStatus } from '@clientfuse/models';
import { secToMs } from '@clientfuse/utils';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PAYMENT_PROVIDER_TOKEN } from '../../../core/modules/stripe/constants/di-tokens.constant';
import { IPaymentProvider, IProviderSubscription } from '../../../core/modules/stripe/interfaces/payment-provider.interface';
import { convertStripeTimestamp } from '../../../core/modules/stripe/utils/stripe.utils';
import { UsersService } from '../../users/users.service';
import { Subscription } from '../schemas/subscription.schema';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class BillingSchedulerService {
  private readonly logger = new Logger(BillingSchedulerService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER_TOKEN) private paymentProvider: IPaymentProvider,
    private subscriptionService: SubscriptionService,
    private usersService: UsersService
  ) {
    this.syncSubscriptions();
  }

  @Cron(CronExpression.EVERY_3_HOURS)
  async syncSubscriptions(): Promise<void> {
    this.logger.log('Starting subscription synchronization job...');

    const startTime = Date.now();
    let syncedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let orphanedCount = 0;

    try {
      const [dbSubscriptions, stripeSubscriptions] = await Promise.all([
        this.subscriptionService.getAllSubscriptions(),
        this.paymentProvider.listSubscriptions()
      ]);

      this.logger.log(
        `Found ${dbSubscriptions.length} subscriptions in DB and ${stripeSubscriptions.length} in Stripe`
      );

      const stripeSubsMap = new Map(
        stripeSubscriptions.map(sub => [sub.id, sub])
      );

      const dbSubsMap = new Map(
        dbSubscriptions.map(sub => [sub.stripeSubscriptionId, sub])
      );

      for (const dbSub of dbSubscriptions) {
        try {
          const stripeSub = stripeSubsMap.get(dbSub.stripeSubscriptionId);

          if (!stripeSub) {
            this.logger.warn(
              `Subscription ${dbSub.stripeSubscriptionId} not found in Stripe (may have been deleted)`
            );
            errorCount++;
            continue;
          }

          const hasChanges = await this.detectChanges(dbSub, stripeSub);

          if (hasChanges) {
            await this.updateSubscription(dbSub.stripeSubscriptionId, stripeSub, dbSub);
            updatedCount++;
            this.logger.log(`Updated subscription ${dbSub.stripeSubscriptionId}`);
          }

          syncedCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to sync subscription ${dbSub.stripeSubscriptionId}:`,
            error
          );
        }
      }

      for (const stripeSub of stripeSubscriptions) {
        if (!dbSubsMap.has(stripeSub.id)) {
          try {
            const created = await this.createOrphanedSubscription(stripeSub);
            if (created) {
              syncedCount++;
              this.logger.log(
                `Successfully created orphaned subscription ${stripeSub.id} in database`
              );
            } else {
              orphanedCount++;
            }
          } catch (error) {
            orphanedCount++;
            this.logger.error(
              `Failed to create orphaned subscription ${stripeSub.id}:`,
              error
            );
          }
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Subscription sync completed in ${duration}ms. ` +
        `Synced: ${syncedCount}, Updated: ${updatedCount}, ` +
        `Orphaned: ${orphanedCount}, Errors: ${errorCount}`
      );
    } catch (error) {
      this.logger.error('Failed to sync subscriptions:', error);
    }
  }

  private async detectChanges(dbSub: Subscription, stripeSub: IProviderSubscription): Promise<boolean> {
    const dbStatus = dbSub.status;
    const stripeStatus = stripeSub.status as SubscriptionStatus;

    if (dbStatus !== stripeStatus) {
      this.logger.log(
        `Status changed for ${dbSub.stripeSubscriptionId}: ${dbStatus} -> ${stripeStatus}`
      );
      return true;
    }

    const dbPeriodEnd = dbSub.currentPeriodEnd?.getTime();
    const stripePeriodEnd = secToMs(stripeSub.currentPeriodEnd);

    if (dbPeriodEnd !== stripePeriodEnd) {
      this.logger.log(
        `Period end changed for ${dbSub.stripeSubscriptionId}: ${dbPeriodEnd} -> ${stripePeriodEnd}`
      );
      return true;
    }

    if (dbSub.cancelAtPeriodEnd !== stripeSub.cancelAtPeriodEnd) {
      this.logger.log(
        `Cancel at period end changed for ${dbSub.stripeSubscriptionId}: ` +
        `${dbSub.cancelAtPeriodEnd} -> ${stripeSub.cancelAtPeriodEnd}`
      );
      return true;
    }

    const dbCancelAt = dbSub.cancelAt?.getTime();
    const stripeCancelAt = stripeSub.cancelAt ? secToMs(stripeSub.cancelAt) : null;

    if (dbCancelAt !== stripeCancelAt) {
      this.logger.log(
        `Cancel at changed for ${dbSub.stripeSubscriptionId}: ${dbCancelAt} -> ${stripeCancelAt}`
      );
      return true;
    }

    if (stripeSub.priceId) {
      const plan = await this.subscriptionService.findPlanByStripePriceId(stripeSub.priceId);
      if (plan) {
        const dbPlanId = dbSub.planId?._id?.toString() || dbSub.planId?.toString();
        const stripePlanId = plan._id.toString();

        if (dbPlanId !== stripePlanId) {
          this.logger.log(
            `Plan changed for ${dbSub.stripeSubscriptionId}: ${dbPlanId} -> ${stripePlanId} ` +
            `(${plan.name})`
          );
          return true;
        }
      }
    }

    return false;
  }

  private async updateSubscription(
    stripeSubscriptionId: string,
    stripeSub: IProviderSubscription,
    dbSub: Subscription
  ): Promise<void> {
    const updates: Partial<ICustomerSubscription> = {
      status: stripeSub.status as SubscriptionStatus,
      currentPeriodStart: convertStripeTimestamp(stripeSub.currentPeriodStart),
      currentPeriodEnd: convertStripeTimestamp(stripeSub.currentPeriodEnd),
      cancelAtPeriodEnd: stripeSub.cancelAtPeriodEnd,
      cancelAt: convertStripeTimestamp(stripeSub.cancelAt),
      canceledAt: convertStripeTimestamp(stripeSub.canceledAt)
    };

    if (stripeSub.priceId) {
      const plan = await this.subscriptionService.findPlanByStripePriceId(stripeSub.priceId);
      if (plan) {
        const dbPlanId = dbSub.planId?._id?.toString() || dbSub.planId?.toString();
        const stripePlanId = plan._id.toString();

        if (dbPlanId !== stripePlanId) {
          updates.planId = stripePlanId;
          this.logger.log(
            `Updating plan for ${stripeSubscriptionId}: ${dbPlanId} -> ${stripePlanId} ` +
            `(${plan.name} - ${plan.billingPeriod})`
          );
        }
      } else {
        this.logger.warn(
          `No matching plan found for Stripe price ID: ${stripeSub.priceId} ` +
          `(subscription: ${stripeSubscriptionId})`
        );
      }
    }

    await this.subscriptionService.updateSubscription(stripeSubscriptionId, updates);
  }

  private async createOrphanedSubscription(stripeSub: IProviderSubscription): Promise<boolean> {
    const user = await this.usersService.findUserByStripeCustomerId(stripeSub.customerId);
    if (!user) {
      this.logger.warn(
        `Cannot create orphaned subscription ${stripeSub.id}: ` +
        `User not found for Stripe customer ${stripeSub.customerId}. ` +
        `Manual review required.`
      );
      return false;
    }

    if (!stripeSub.priceId) {
      this.logger.warn(
        `Cannot create orphaned subscription ${stripeSub.id}: ` +
        `No price ID found in Stripe subscription. ` +
        `Manual review required.`
      );
      return false;
    }

    const plan = await this.subscriptionService.findPlanByStripePriceId(stripeSub.priceId);
    if (!plan) {
      this.logger.warn(
        `Cannot create orphaned subscription ${stripeSub.id}: ` +
        `Plan not found for Stripe price ID ${stripeSub.priceId}. ` +
        `Manual review required.`
      );
      return false;
    }

    try {
      await this.subscriptionService.createSubscription({
        userId: user._id,
        stripeCustomerId: stripeSub.customerId,
        stripeSubscriptionId: stripeSub.id,
        planId: plan._id.toString(),
        status: stripeSub.status as SubscriptionStatus,
        currentPeriodStart: convertStripeTimestamp(stripeSub.currentPeriodStart),
        currentPeriodEnd: convertStripeTimestamp(stripeSub.currentPeriodEnd),
        cancelAtPeriodEnd: stripeSub.cancelAtPeriodEnd,
        cancelAt: convertStripeTimestamp(stripeSub.cancelAt),
        canceledAt: convertStripeTimestamp(stripeSub.canceledAt),
        trialStart: convertStripeTimestamp(stripeSub.trialStart),
        trialEnd: convertStripeTimestamp(stripeSub.trialEnd)
      });

      this.logger.log(
        `Created orphaned subscription ${stripeSub.id} for user ${user._id} ` +
        `with plan ${plan.name} (${plan.billingPeriod})`
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error creating orphaned subscription ${stripeSub.id}:`,
        error
      );
      return false;
    }
  }
}
