import { IAgencyBase, IGoogleAccessLinkBase } from '@connectly/models';
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
      google: {
        ads: {
          isViewAccessEnabled: { type: Boolean, required: true },
          isManageAccessEnabled: { type: Boolean, required: true },
          email: { type: String, required: true },
          method: { type: String, required: true }
        },
        analytics: {
          isViewAccessEnabled: { type: Boolean, required: true },
          isManageAccessEnabled: { type: Boolean, required: true },
          email: { type: String, required: true }
        },
        merchantCenter: {
          isViewAccessEnabled: { type: Boolean, required: true },
          isManageAccessEnabled: { type: Boolean, required: true },
          email: { type: String, required: true }
        },
        myBusiness: {
          isViewAccessEnabled: { type: Boolean, required: true },
          isManageAccessEnabled: { type: Boolean, required: true },
          emailOrId: { type: String, required: true }
        },
        searchConsole: {
          isViewAccessEnabled: { type: Boolean, required: true },
          isManageAccessEnabled: { type: Boolean, required: true },
          email: { type: String, required: true }
        },
        tagManager: {
          isViewAccessEnabled: { type: Boolean, required: true },
          isManageAccessEnabled: { type: Boolean, required: true },
          email: { type: String, required: true }
        }
      },
      facebook: { default: {} }
    },
    required: true
  })
  defaultAccessLink: {
    google: {
      ads: IGoogleAccessLinkBase & { email: string; method: string };
      analytics: IGoogleAccessLinkBase & { email: string };
      merchantCenter: IGoogleAccessLinkBase & { email: string };
      myBusiness: IGoogleAccessLinkBase & { emailOrId: string };
      searchConsole: IGoogleAccessLinkBase & { email: string };
      tagManager: IGoogleAccessLinkBase & { email: string };
    };
    facebook: {};
  };
}

export const AgencySchema = SchemaFactory.createForClass(Agency);

AgencySchema.set('toJSON', {
  flattenObjectIds: true,
  versionKey: false
});
