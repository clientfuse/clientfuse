import { TBaseConnectionResult, IGrantAccessResponse, TPlatformNamesKeys, AccessType } from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsDefined, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';


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

  @IsString()
  @IsDefined()
  @IsIn(['view', 'manage'])
  accessType: AccessType;
}