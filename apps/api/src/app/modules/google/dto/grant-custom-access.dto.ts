import { GoogleServiceType, ICustomAccessOptions, IGrantCustomAccessDto } from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';

export class GrantCustomAccessDto implements IGrantCustomAccessDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(['analytics', 'ads', 'tagManager', 'searchConsole', 'merchantCenter', 'myBusiness'])
  @IsNotEmpty()
  service: GoogleServiceType;

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  options: ICustomAccessOptions;
}