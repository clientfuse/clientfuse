import { AccessType, TConnectionLinkBase, TFacebookAccessLink, TGoogleConnectionLink, VALIDATORS } from '@clientfuse/models';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ConnectionLinkDocument = mongoose.HydratedDocument<ConnectionLink>;

@Schema({ timestamps: true, collection: 'connection_links' })
export class ConnectionLink implements TConnectionLinkBase {
  @Prop({ type: String, required: true, minlength: VALIDATORS.CONNECTION_LINK.NAME.MIN_LENGTH, maxlength: VALIDATORS.CONNECTION_LINK.NAME.MAX_LENGTH })
  name: string;

  @Prop({ type: String, ref: 'Agency', required: true })
  agencyId: string;

  @Prop({ type: Boolean, required: true, default: false })
  isDefault: boolean;

  @Prop({ type: String, enum: Object.values(AccessType), required: true })
  type: AccessType;

  @Prop({
    type: {
      googleAds: {
        isEnabled: { type: Boolean, required: true },
        email: { type: String, required: false },
        method: { type: String, required: true }
      },
      googleAnalytics: {
        isEnabled: { type: Boolean, required: true },
        email: { type: String, required: false }
      },
      googleMerchantCenter: {
        isEnabled: { type: Boolean, required: true },
        email: { type: String, required: false }
      },
      googleMyBusiness: {
        isEnabled: { type: Boolean, required: true },
        emailOrId: { type: String, required: false }
      },
      googleSearchConsole: {
        isEnabled: { type: Boolean, required: true },
        email: { type: String, required: false }
      },
      googleTagManager: {
        isEnabled: { type: Boolean, required: true },
        email: { type: String, required: false }
      }
    },
    required: false
  })
  google?: TGoogleConnectionLink;

  @Prop({
    type: {
      facebookAds: {
        isEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      facebookBusiness: {
        isEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      facebookPages: {
        isEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      facebookCatalogs: {
        isEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      facebookPixels: {
        isEnabled: { type: Boolean, required: true },
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

ConnectionLinkSchema.index({ agencyId: 1, type: 1, isDefault: 1 });
