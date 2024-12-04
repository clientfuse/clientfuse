import { IRegistrationCredentials } from '@connectly/models';
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
  googleId: string | null;
}

export const UsersSchema = SchemaFactory.createForClass(User);

UsersSchema.set('toJSON', {
  flattenObjectIds: true,
  versionKey: false
});
