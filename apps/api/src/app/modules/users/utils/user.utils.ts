import { IRegistrationCredentials, IUserResponse } from '@connectly/models';
import * as bcryptJs from 'bcryptjs';

export const getUserWithoutSensitiveData = (
  user: IRegistrationCredentials & IUserResponse
): IUserResponse => {
  const { password, ...userWithoutPassword } = user;
  // delete userWithoutPassword.google.accessToken;
  // delete userWithoutPassword.google.refreshToken;
  // delete userWithoutPassword.facebook.accessToken;
  return userWithoutPassword;
};

export const encryptPassword = async (password: string): Promise<string> => {
  const salt = await bcryptJs.genSalt(10);
  return await bcryptJs.hash(password, salt);
};
