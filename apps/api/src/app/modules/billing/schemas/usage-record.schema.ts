import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'usage_records' })
export class UsageRecord extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Subscription' })
  subscriptionId: Types.ObjectId;

  @Prop({ required: true, enum: ['users', 'agencies', 'storage', 'apiCalls'] })
  metricType: 'users' | 'agencies' | 'storage' | 'apiCalls';

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: false, type: Object })
  metadata?: Record<string, any>;
}

export const UsageRecordSchema = SchemaFactory.createForClass(UsageRecord);

UsageRecordSchema.index({ subscriptionId: 1 });
UsageRecordSchema.index({ metricType: 1 });
UsageRecordSchema.index({ timestamp: -1 });
UsageRecordSchema.index({ subscriptionId: 1, metricType: 1, timestamp: -1 });
