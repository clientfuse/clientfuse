import { IGoogleAdsAccount, IRegistrationCredentials, Role } from '@connectly/models';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  analytics_v3,
  content_v2_1,
  mybusinessaccountmanagement_v1,
  mybusinessbusinessinformation_v1,
  searchconsole_v1,
  tagmanager_v2
} from 'googleapis';
import * as mongoose from 'mongoose';

export type UserDocument = mongoose.HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User implements IRegistrationCredentials {
  // *** User identification fields ***
  @Prop({ type: String, default: null })
  birthDate: string | null;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: Boolean, default: false })
  isLoggedInWithFacebook: boolean;

  @Prop({ type: Boolean, default: false })
  isLoggedInWithGoogle: boolean;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: Date, required: false })
  lastSeenDate: Date | null;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, default: null })
  phone: string | null;

  @Prop({ type: String, enum: Object.values(Role), default: 'manager' })
  role: Role;

  // *** Google-related fields ***
  @Prop({ type: String, default: null })
  googleAccessToken: string | null;

  @Prop({ type: [Object], default: [] })
  googleAdsAccounts: IGoogleAdsAccount[];

  @Prop({ type: [Object], default: [] })
  googleAnalyticsAccounts: analytics_v3.Schema$Account[];

  @Prop({ type: [String], default: [] })
  googleGrantedScopes: string[];

  @Prop({ type: [Object], default: [] })
  googleMerchantCenters: content_v2_1.Schema$AccountIdentifier[];

  @Prop({ type: [Object], default: [] })
  googleMyBusinessAccounts: mybusinessaccountmanagement_v1.Schema$Account[];

  @Prop({ type: [Object], default: [] })
  googleMyBusinessLocations: mybusinessbusinessinformation_v1.Schema$Location[];

  @Prop({ type: String, default: null })
  googleRefreshToken: string | null;

  @Prop({ type: [Object], default: [] })
  googleSearchConsoles: searchconsole_v1.Schema$WmxSite[];

  @Prop({ type: [Object], default: [] })
  googleTagManagers: tagmanager_v2.Schema$Account[];

  @Prop({ type: Date, default: null })
  googleTokenExpirationDate: Date | null;

  @Prop({ type: String, default: null })
  googleUserId: string | null;

  // *** Facebook-related fields ***
  @Prop({ type: String, default: null })
  facebookAccessToken: string | null;

  @Prop({ type: [String], default: [] })
  facebookGrantedScopes: string[];

  @Prop({ type: String, default: null })
  facebookUserId: string | null;
}

export const UsersSchema = SchemaFactory.createForClass(User);

UsersSchema.set('toJSON', {
  flattenObjectIds: true,
  versionKey: false
});
