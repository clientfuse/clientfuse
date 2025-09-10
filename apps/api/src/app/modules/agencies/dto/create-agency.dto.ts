import { IAgencyBase } from '@clientfuse/models';
import { IsDefined, IsEmail, IsString } from 'class-validator';

export class CreateAgencyDto implements IAgencyBase {
  @IsString()
  @IsDefined()
  userId: string;

  @IsEmail()
  @IsString()
  @IsDefined()
  email: string;
}
