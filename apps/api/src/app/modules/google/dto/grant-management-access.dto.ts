import { GoogleServiceType, IGrantAgencyAccessDto } from '@clientfuse/models';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class GrantManagementAccessDto implements IGrantAgencyAccessDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsEnum(['analytics', 'ads', 'tagManager', 'searchConsole', 'merchantCenter', 'myBusiness'])
  @IsNotEmpty()
  service: GoogleServiceType;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  agencyIdentifier: string;
}
