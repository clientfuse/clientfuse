import { TBaseConnectionResult, IGrantAccessResponse, TPlatformNamesKeys } from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsDefined, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';


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
  @Type(() => Object)
  @IsDefined()
  grantedAccesses: Record<TPlatformNamesKeys, IGrantAccessResponse[]>;
}