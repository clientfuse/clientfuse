import { FacebookServiceType, IGrantAgencyAccessDto } from '@clientfuse/models';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class GrantManagementAccessDto implements IGrantAgencyAccessDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsEnum(['business', 'adAccount', 'page', 'catalog'])
  @IsNotEmpty()
  service: FacebookServiceType;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  agencyEmail: string;
}