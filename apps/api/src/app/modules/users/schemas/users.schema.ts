import {
  IGoogleAdsAccount,
  IGoogleMerchantCenter,
  IGoogleMyBusinessAccount,
  IGoogleMyBusinessLocation,
  IGoogleSearchConsole,
  IGoogleTagManagerAccount,
  IRegistrationCredentials
} from '@connectly/models';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = mongoose.HydratedDocument<User>;

@Schema()
export class User implements IRegistrationCredentials {
  @Prop({type: String, required: true})
  email: string;

  @Prop({type: String, required: true})
  firstName: string;

  @Prop({type: String, required: true})
  lastName: string;

  @Prop({type: String, required: true})
  password: string;

  @Prop({type: Number, required: true})
  registrationDate: number;

  @Prop({type: Number, required: false})
  lastSeenDate: number | null;

  @Prop({type: String, default: null})
  phone: string | null;

  @Prop({type: String, default: null})
  birthDate: string | null;

  @Prop({type: String, default: null})
  googleUserId: string | null;

  @Prop({type: String, default: null})
  googleAccessToken: string | null;

  @Prop({type: [String], default: []})
  googleGrantedScopes: string[];

  @Prop({type: [Object], default: []})
  googleAdsAccounts: IGoogleAdsAccount[];

  @Prop({type: [Object], default: []})
  googleTagManagerAccounts: IGoogleTagManagerAccount[];

  @Prop({type: [Object], default: []})
  googleSearchConsoles: IGoogleSearchConsole[];

  @Prop({type: [Object], default: []})
  googleMyBusinessAccounts: IGoogleMyBusinessAccount[];

  @Prop({type: [Object], default: []})
  googleMerchantCenters: IGoogleMerchantCenter[];

  @Prop({type: [Object], default: []})
  googleMyBusinessLocations: IGoogleMyBusinessLocation[];

  @Prop({type: String, default: null})
  facebookUserId: string | null;

  @Prop({type: [String], default: []})
  facebookGrantedScopes: string[];

  @Prop({type: String, default: null})
  facebookAccessToken: string | null;

  @Prop({type: Boolean, default: false})
  isLoggedInWithFacebook: boolean;

  @Prop({type: Boolean, default: false})
  isLoggedInWithGoogle: boolean;
}

export const UsersSchema = SchemaFactory.createForClass(User);

UsersSchema.set('toJSON', {
  flattenObjectIds: true,
  versionKey: false
});
