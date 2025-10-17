import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubscriptionStatus } from '@clientfuse/models';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  stripeCustomerId: string;

  @Prop({ required: true, unique: true })
  stripeSubscriptionId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'SubscriptionPlan' })
  planId: Types.ObjectId;

  @Prop({ required: true, type: String, enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @Prop({ required: true })
  currentPeriodStart: Date;

  @Prop({ required: true })
  currentPeriodEnd: Date;

  @Prop({ required: true, default: false })
  cancelAtPeriodEnd: boolean;

  @Prop({ required: false })
  canceledAt?: Date;

  @Prop({ required: false })
  trialStart?: Date;

  @Prop({ required: false })
  trialEnd?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ userId: 1, status: 1 });
