import { TBaseConnectionResult, IGrantAccessResponse, TPlatformNamesKeys, TAccessType } from '@clientfuse/models';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ConnectionResultDocument = mongoose.HydratedDocument<ConnectionResult>;

@Schema({ timestamps: true, collection: 'connection_results' })
export class ConnectionResult implements TBaseConnectionResult {
  @Prop({ type: String, ref: 'Agency', required: true, index: true })
  agencyId: string;

  @Prop({ type: String, ref: 'ConnectionLink', required: true, index: true })
  connectionLinkId: string;

  @Prop({ type: String, required: false, index: true })
  googleUserId?: string;

  @Prop({ type: String, required: false, index: true })
  facebookUserId?: string;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  })
  grantedAccesses: Record<TPlatformNamesKeys, IGrantAccessResponse[]>;

  @Prop({ type: String, required: true, enum: ['view', 'manage'], index: true })
  accessType: TAccessType;

  updatedAt: Date;
  createdAt: Date;
}

export const ConnectionResultSchema = SchemaFactory.createForClass(ConnectionResult);

ConnectionResultSchema.set('toJSON', {
  flattenObjectIds: true,
  versionKey: false
});

ConnectionResultSchema.index({ agencyId: 1, connectionLinkId: 1 });
ConnectionResultSchema.index({ agencyId: 1, googleUserId: 1 });
ConnectionResultSchema.index({ agencyId: 1, facebookUserId: 1 });
ConnectionResultSchema.index({ googleUserId: 1, facebookUserId: 1 });
