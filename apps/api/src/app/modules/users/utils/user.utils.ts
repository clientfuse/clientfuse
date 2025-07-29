import { IRegistrationCredentials, IUserResponse } from '@connectly/models';
import * as bcryptJs from 'bcryptjs';

export const getUserWithoutPassword = (
  user: IRegistrationCredentials & IUserResponse
): IUserResponse => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const encryptPassword = async (password: string): Promise<string> => {
  const salt = await bcryptJs.genSalt(10);
  return await bcryptJs.hash(password, salt);
};
