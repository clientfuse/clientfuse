import { TBaseConnectionResult, IGrantAccessResponse } from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsDefined, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';

class GrantedAccessesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  google: IGrantAccessResponse[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  facebook: IGrantAccessResponse[];
}

export class CreateConnectionResultDto implements TBaseConnectionResult {
  @IsString()
  @IsDefined()
  agencyId: string;

  @IsString()
  @IsDefined()
  connectionLinkId: string;

  @IsString()
  @IsOptional()
  googleUserId?: string;

  @IsString()
  @IsOptional()
  facebookUserId?: string;

  @ValidateNested()
  @Type(() => GrantedAccessesDto)
  @IsDefined()
  grantedAccesses: GrantedAccessesDto;
}