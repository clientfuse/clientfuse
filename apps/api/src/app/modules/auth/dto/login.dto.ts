import { IRegistrationCredentials } from '@connectly/models';
import { IsDefined, IsEmail, IsString } from 'class-validator';

export class LoginDto implements Pick<IRegistrationCredentials, 'email' | 'password'> {
  @IsString()
  @IsEmail()
  @IsDefined()
  email: string;

  @IsString()
  @IsDefined()
  password: string;
}
