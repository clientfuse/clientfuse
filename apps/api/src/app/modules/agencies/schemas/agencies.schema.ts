import { IAgencyBase, TFacebookAccessLink, TGoogleAccessLink } from '@clientfuse/models';
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
        type: {
          ads: {
            isViewAccessEnabled: { type: Boolean, required: true },
            isManageAccessEnabled: { type: Boolean, required: true },
            email: { type: String, required: false },
            method: { type: String, required: true }
          },
          analytics: {
            isViewAccessEnabled: { type: Boolean, required: true },
            isManageAccessEnabled: { type: Boolean, required: true },
            email: { type: String, required: false }
          },
          merchantCenter: {
            isViewAccessEnabled: { type: Boolean, required: true },
            isManageAccessEnabled: { type: Boolean, required: true },
            email: { type: String, required: false }
          },
          myBusiness: {
            isViewAccessEnabled: { type: Boolean, required: true },
            isManageAccessEnabled: { type: Boolean, required: true },
            emailOrId: { type: String, required: false }
          },
          searchConsole: {
            isViewAccessEnabled: { type: Boolean, required: true },
            isManageAccessEnabled: { type: Boolean, required: true },
            email: { type: String, required: false }
          },
          tagManager: {
            isViewAccessEnabled: { type: Boolean, required: true },
            isManageAccessEnabled: { type: Boolean, required: true },
            email: { type: String, required: false }
          }
        },
        required: false
      },
      facebook: {
        type: {
          ads: {
            isViewAccessEnabled: { type: Boolean, required: true },
            isManageAccessEnabled: { type: Boolean, required: true },
            entityId: { type: String, required: false }
          },
          business: {
            isViewAccessEnabled: { type: Boolean, required: true },
            isManageAccessEnabled: { type: Boolean, required: true },
            entityId: { type: String, required: false }
          },
          pages: {
            isViewAccessEnabled: { type: Boolean, required: true },
            isManageAccessEnabled: { type: Boolean, required: true },
            entityId: { type: String, required: false }
          },
          catalogs: {
            isViewAccessEnabled: { type: Boolean, required: true },
            isManageAccessEnabled: { type: Boolean, required: true },
            entityId: { type: String, required: false }
          }
        },
        required: false
      }
    },
    required: false
  })
  defaultAccessLink: {
    google?: TGoogleAccessLink;
    facebook?: TFacebookAccessLink;
  };

  updatedAt: Date;
  createdAt: Date;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);

AgencySchema.set('toJSON', {
  flattenObjectIds: true,
  versionKey: false
});
