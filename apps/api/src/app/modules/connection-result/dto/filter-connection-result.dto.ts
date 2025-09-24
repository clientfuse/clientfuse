import { TConnectionResultFilter } from '@clientfuse/models';
import { IsOptional, IsString } from 'class-validator';

export class FilterConnectionResultDto implements TConnectionResultFilter {
  @IsString()
  @IsOptional()
  agencyId?: string;

  @IsString()
  @IsOptional()
  connectionLinkId?: string;

  @IsString()
  @IsOptional()
  googleUserId?: string;

  @IsString()
  @IsOptional()
  facebookUserId?: string;
}