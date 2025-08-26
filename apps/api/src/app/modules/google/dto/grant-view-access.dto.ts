import { GoogleServiceType, IGrantViewAccessDto } from '@clientfuse/models';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class GrantViewAccessDto implements IGrantViewAccessDto {
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
  agencyEmail: string;
}