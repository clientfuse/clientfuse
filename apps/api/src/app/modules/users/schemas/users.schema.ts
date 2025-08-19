import { IFacebookInfo, IGoogleInfo, IRegistrationCredentials, Role } from '@clientfuse/models';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
  @Prop({
    type: {
      accessToken: { type: String, default: null },
      refreshToken: { type: String, default: null },
      tokenExpirationDate: { type: Date, default: null },
      userId: { type: String, default: null },
      adsAccounts: { type: [Object], default: [] },
      analyticsAccounts: { type: [Object], default: [] },
      grantedScopes: { type: [String], default: [] },
      merchantCenters: { type: [Object], default: [] },
      myBusinessAccounts: { type: [Object], default: [] },
      myBusinessLocations: { type: [Object], default: [] },
      searchConsoles: { type: [Object], default: [] },
      tagManagers: { type: [Object], default: [] }
    },
    default: {}
  })
  google: IGoogleInfo;

  // *** Facebook-related fields ***
  @Prop({
    type: {
      accessToken: { type: String, default: null },
      grantedScopes: { type: [String], default: [] },
      userId: { type: String, default: null },
      adsAccounts: { type: [Object], default: [] },
      businessAccounts: { type: [Object], default: [] },
      pages: { type: [Object], default: [] },
      catalogs: { type: [Object], default: [] }
    },
    default: {}
  })
  facebook: IFacebookInfo;

  updatedAt: Date;
  createdAt: Date;
}

export const UsersSchema = SchemaFactory.createForClass(User);

UsersSchema.set('toJSON', {
  flattenObjectIds: true,
  versionKey: false
});
