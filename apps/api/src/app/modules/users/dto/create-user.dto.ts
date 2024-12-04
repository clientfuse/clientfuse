import { IRegistrationCredentials } from '@connectly/models';
import { IsDefined, IsEmail, IsNumber, IsString } from 'class-validator';

export class CreateUserDto implements IRegistrationCredentials {

  @IsEmail()
  @IsString()
  @IsDefined()
  email: string;

  @IsString()
  @IsDefined()
  password: string;

  @IsString()
  @IsDefined()
  firstName: string;

  @IsString()
  @IsDefined()
  lastName: string;


  @IsNumber()
  @IsDefined()
  registrationDate: number;

  @IsString()
  phone?: string;

  @IsString()
  birthDate?: string;

  @IsNumber()
  lastSeenDate?: number;

  @IsString()
  googleId?: string;
}
