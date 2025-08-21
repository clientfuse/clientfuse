import { GoogleServiceType, IRevokeAgencyAccessDto } from '@clientfuse/models';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class RevokeAgencyAccessDto implements IRevokeAgencyAccessDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(['analytics', 'ads', 'tagManager', 'searchConsole', 'merchantCenter', 'myBusiness'])
  @IsNotEmpty()
  service: GoogleServiceType;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  linkId: string;
}