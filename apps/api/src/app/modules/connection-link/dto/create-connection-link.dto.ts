import { AccessType, TConnectionLinkBase, VALIDATORS } from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { FacebookAccessDto } from './facebook-access-link.dto';
import { GoogleAccessDto } from './google-access-link.dto';

export class CreateConnectionLinkDto implements TConnectionLinkBase {
  @IsString()
  @IsDefined()
  @MinLength(VALIDATORS.CONNECTION_LINK.NAME.MIN_LENGTH)
  @MaxLength(VALIDATORS.CONNECTION_LINK.NAME.MAX_LENGTH)
  name: string;

  @IsString()
  @IsDefined()
  agencyId: string;

  @IsBoolean()
  @IsDefined()
  isDefault: boolean;

  @IsEnum(AccessType)
  @IsDefined()
  type: AccessType;

  @ValidateNested()
  @Type(() => GoogleAccessDto)
  @IsOptional()
  google?: GoogleAccessDto;

  @ValidateNested()
  @Type(() => FacebookAccessDto)
  @IsOptional()
  facebook?: FacebookAccessDto;
}
