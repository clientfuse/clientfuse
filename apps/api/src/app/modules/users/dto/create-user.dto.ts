import { IRegistrationCredentials, Role } from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsDefined, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { FacebookInfoDto } from './facebook-info.dto';
import { GoogleInfoDto } from './google-info.dto';

export class CreateUserDto implements IRegistrationCredentials {
  // *** User identification fields ***
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

  @IsString()
  @IsOptional()
  phone: string | null;

  @IsString()
  @IsOptional()
  birthDate: string | null;

  @IsDate()
  @IsOptional()
  lastSeenDate: Date | null;

  @IsEnum(Role)
  role: Role;

  // *** Google-related fields ***
  @IsDefined()
  @Type(() => GoogleInfoDto)
  google: GoogleInfoDto;

  // *** Facebook-related fields ***
  @IsDefined()
  @Type(() => FacebookInfoDto)
  facebook: FacebookInfoDto;

  @IsBoolean()
  @IsOptional()
  isLoggedInWithGoogle: boolean;

  @IsBoolean()
  @IsOptional()
  isLoggedInWithFacebook: boolean;
}
