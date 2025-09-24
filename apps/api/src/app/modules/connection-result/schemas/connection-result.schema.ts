import { TBaseConnectionResult, IGrantAccessResponse } from '@clientfuse/models';
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
    type: {
      google: [{
        success: { type: Boolean, required: true },
        service: { type: String, required: true },
        accessType: { type: String, required: true },
        entityId: { type: String, required: true },
        agencyIdentifier: { type: String, required: true },
        linkId: { type: String, required: false },
        message: { type: String, required: false },
        error: { type: String, required: false }
      }],
      facebook: [{
        success: { type: Boolean, required: true },
        service: { type: String, required: true },
        accessType: { type: String, required: true },
        entityId: { type: String, required: true },
        agencyIdentifier: { type: String, required: true },
        linkId: { type: String, required: false },
        message: { type: String, required: false },
        error: { type: String, required: false }
      }]
    },
    required: true
  })
  grantedAccesses: {
    google: IGrantAccessResponse[];
    facebook: IGrantAccessResponse[];
  };

  updatedAt: Date;
  createdAt: Date;
}

export const ConnectionResultSchema = SchemaFactory.createForClass(ConnectionResult);

ConnectionResultSchema.set('toJSON', {
  flattenObjectIds: true,
  versionKey: false
});

// Create compound indexes for efficient querying
ConnectionResultSchema.index({ agencyId: 1, connectionLinkId: 1 });
ConnectionResultSchema.index({ agencyId: 1, googleUserId: 1 });
ConnectionResultSchema.index({ agencyId: 1, facebookUserId: 1 });
ConnectionResultSchema.index({ googleUserId: 1, facebookUserId: 1 });