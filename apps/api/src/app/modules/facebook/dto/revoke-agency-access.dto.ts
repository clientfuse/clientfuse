import { FacebookServiceType, IRevokeAgencyAccessDto } from '@clientfuse/models';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class RevokeAgencyAccessDto implements IRevokeAgencyAccessDto {
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
  linkId: string;
}