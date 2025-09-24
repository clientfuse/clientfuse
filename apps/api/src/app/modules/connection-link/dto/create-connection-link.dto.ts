import { TAccessType, TConnectionLinkBase } from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FacebookAccessDto } from './facebook-access-link.dto';
import { GoogleAccessDto } from './google-access-link.dto';

export class CreateConnectionLinkDto implements TConnectionLinkBase {
  @IsString()
  @IsDefined()
  agencyId: string;

  @IsBoolean()
  @IsDefined()
  isDefault: boolean;

  @IsEnum(['view', 'manage'])
  @IsDefined()
  type: TAccessType;

  @ValidateNested()
  @Type(() => GoogleAccessDto)
  @IsOptional()
  google?: GoogleAccessDto;

  @ValidateNested()
  @Type(() => FacebookAccessDto)
  @IsOptional()
  facebook?: FacebookAccessDto;
}
