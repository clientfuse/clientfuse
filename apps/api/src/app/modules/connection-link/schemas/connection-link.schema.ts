import { TConnectionLinkBase, TFacebookAccessLink, TGoogleConnectionLink } from '@clientfuse/models';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ConnectionLinkDocument = mongoose.HydratedDocument<ConnectionLink>;

@Schema({ timestamps: true, collection: 'connection_links' })
export class ConnectionLink implements TConnectionLinkBase {
  @Prop({ type: String, ref: 'Agency', required: true, index: true })
  agencyId: string;

  @Prop({ type: Boolean, required: true, default: false })
  isDefault: boolean;

  @Prop({
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
  })
  google?: TGoogleConnectionLink;

  @Prop({
    type: {
      ads: {
        isViewAccessEnabled: { type: Boolean, required: true },
        isManageAccessEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      business: {
        isViewAccessEnabled: { type: Boolean, required: true },
        isManageAccessEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      pages: {
        isViewAccessEnabled: { type: Boolean, required: true },
        isManageAccessEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      catalogs: {
        isViewAccessEnabled: { type: Boolean, required: true },
        isManageAccessEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      }
    },
    required: false
  })
  facebook?: TFacebookAccessLink;

  updatedAt: Date;
  createdAt: Date;
}

export const ConnectionLinkSchema = SchemaFactory.createForClass(ConnectionLink);

ConnectionLinkSchema.set('toJSON', {
  flattenObjectIds: true,
  versionKey: false
});

ConnectionLinkSchema.index({ agencyId: 1, isDefault: 1 });
