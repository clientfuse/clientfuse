import { IAgencyBase, IWhiteLabelingConfig } from '@clientfuse/models';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type AgencyDocument = mongoose.HydratedDocument<Agency>;

@Schema({ timestamps: true, collection: 'agencies' })
export class Agency implements IAgencyBase {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({
    type: {
      agencyName: { type: String, default: null },
      agencyLogo: { type: String, default: null },
    },
    default: { agencyName: null, agencyLogo: null },
    required: true,
  })
  whiteLabeling: IWhiteLabelingConfig;

  updatedAt: Date;
  createdAt: Date;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);

AgencySchema.set('toJSON', {
  flattenObjectIds: true,
  versionKey: false
});
