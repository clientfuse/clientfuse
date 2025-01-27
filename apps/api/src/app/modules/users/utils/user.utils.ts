import { IRegistrationCredentials, IUserResponse } from '@connectly/models';
import * as bcryptJs from 'bcryptjs';
import { from, Observable, switchMap } from 'rxjs';

export const getUserWithoutPassword = (user: IRegistrationCredentials & { _id }): IUserResponse => {
  const {password, ...userWithoutPassword} = user;
  return userWithoutPassword;
};

export const encryptPassword = (password: string): Observable<string> => {
  return from(bcryptJs.genSalt(10))
    .pipe(
      switchMap((salt: string) => from(bcryptJs.hash(password, salt)))
    );
};
