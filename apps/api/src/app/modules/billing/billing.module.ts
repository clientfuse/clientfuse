import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BillingController } from './billing.controller';
import { BillingService } from './services/billing.service';
import { SubscriptionService } from './services/subscription.service';
import { WebhookService } from './services/webhook.service';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { SubscriptionPlan, SubscriptionPlanSchema } from './schemas/subscription-plan.schema';
import { UsageRecord, UsageRecordSchema } from './schemas/usage-record.schema';
import { PaidSubscriptionGuard } from './guards/paid-subscription.guard';
import { User, UsersSchema } from '../users/schemas/users.schema';

/**
 * Billing Module
 *
 * Handles all billing-related functionality including:
 * - Subscription management
 * - Stripe checkout and portal
 * - Webhook processing
 * - Access control for paid features
 *
 * Imports StripeModule from core for Stripe functionality
 */
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: UsageRecord.name, schema: UsageRecordSchema },
      { name: User.name, schema: UsersSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [
    BillingService,
    SubscriptionService,
    WebhookService,
    PaidSubscriptionGuard,
  ],
  exports: [BillingService, SubscriptionService, PaidSubscriptionGuard],
})
export class BillingModule {}
