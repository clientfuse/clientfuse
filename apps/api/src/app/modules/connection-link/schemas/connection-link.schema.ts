import { CONNECTION_LINK_VALIDATORS } from '@clientfuse/models';
import { TAccessType, TConnectionLinkBase, TFacebookAccessLink, TGoogleConnectionLink } from '@clientfuse/models';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ConnectionLinkDocument = mongoose.HydratedDocument<ConnectionLink>;

@Schema({ timestamps: true, collection: 'connection_links' })
export class ConnectionLink implements TConnectionLinkBase {
  @Prop({ type: String, required: true, minlength: CONNECTION_LINK_VALIDATORS.NAME.MIN_LENGTH, maxlength: CONNECTION_LINK_VALIDATORS.NAME.MAX_LENGTH })
  name: string;

  @Prop({ type: String, ref: 'Agency', required: true })
  agencyId: string;

  @Prop({ type: Boolean, required: true, default: false })
  isDefault: boolean;

  @Prop({ type: String, enum: ['view', 'manage'], required: true })
  type: TAccessType;

  @Prop({
    type: {
      ads: {
        isEnabled: { type: Boolean, required: true },
        email: { type: String, required: false },
        method: { type: String, required: true }
      },
      analytics: {
        isEnabled: { type: Boolean, required: true },
        email: { type: String, required: false }
      },
      merchantCenter: {
        isEnabled: { type: Boolean, required: true },
        email: { type: String, required: false }
      },
      myBusiness: {
        isEnabled: { type: Boolean, required: true },
        emailOrId: { type: String, required: false }
      },
      searchConsole: {
        isEnabled: { type: Boolean, required: true },
        email: { type: String, required: false }
      },
      tagManager: {
        isEnabled: { type: Boolean, required: true },
        email: { type: String, required: false }
      }
    },
    required: false
  })
  google?: TGoogleConnectionLink;

  @Prop({
    type: {
      ads: {
        isEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      business: {
        isEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      pages: {
        isEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      catalogs: {
        isEnabled: { type: Boolean, required: true },
        businessPortfolioId: { type: String, required: false }
      },
      pixels: {
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
