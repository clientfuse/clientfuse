import { FacebookServiceType, IGrantAgencyAccessDto } from '@clientfuse/models';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class GrantManagementAccessDto implements IGrantAgencyAccessDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsEnum(FacebookServiceType)
  @IsNotEmpty()
  service: FacebookServiceType;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  agencyEmail: string;
}
