import { IsString, IsNotEmpty, IsArray } from 'class-validator';
import { IGrantAgencyAccessDto } from '@clientfuse/models';

export class GrantAgencyAccessDto implements IGrantAgencyAccessDto {
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  agencyEmail: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}