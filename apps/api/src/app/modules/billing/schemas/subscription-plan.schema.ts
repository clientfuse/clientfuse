import { BillingPeriod, ISubscriptionPlanLimits, TierType } from '@clientfuse/models';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'subscription_plans' })
export class SubscriptionPlan extends Document {
  @Prop({ required: true, type: String, enum: TierType })
  tierType: TierType;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  stripePriceId: string;

  @Prop({ required: true })
  stripeProductId: string;

  @Prop({ required: true, type: String, enum: BillingPeriod })
  billingPeriod: BillingPeriod;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, default: 'usd' })
  currency: string;

  @Prop({ required: true, type: [String] })
  features: string[];

  @Prop({ required: true, type: Object })
  limits: ISubscriptionPlanLimits;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);

SubscriptionPlanSchema.index({ tierType: 1, billingPeriod: 1 });
SubscriptionPlanSchema.index({ isActive: 1 });
