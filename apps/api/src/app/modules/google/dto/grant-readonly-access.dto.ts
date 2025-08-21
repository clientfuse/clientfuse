import { GoogleServiceType, IGrantReadOnlyAccessDto } from '@clientfuse/models';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class GrantReadOnlyAccessDto implements IGrantReadOnlyAccessDto {
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
  agencyEmail: string;
}