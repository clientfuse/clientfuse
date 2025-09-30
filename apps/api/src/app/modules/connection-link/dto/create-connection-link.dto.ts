import { CONNECTION_LINK_VALIDATORS } from '@clientfuse/models';
import { AccessType, TConnectionLinkBase } from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { FacebookAccessDto } from './facebook-access-link.dto';
import { GoogleAccessDto } from './google-access-link.dto';

export class CreateConnectionLinkDto implements TConnectionLinkBase {
  @IsString()
  @IsDefined()
  @MinLength(CONNECTION_LINK_VALIDATORS.NAME.MIN_LENGTH)
  @MaxLength(CONNECTION_LINK_VALIDATORS.NAME.MAX_LENGTH)
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
