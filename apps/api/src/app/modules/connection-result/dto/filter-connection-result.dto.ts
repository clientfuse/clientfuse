import { TConnectionResultFilter, AccessType, TPlatformNamesKeys } from '@clientfuse/models';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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

  // Pagination
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  skip?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  // Sorting
  @IsString()
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt'])
  sortBy?: 'createdAt' | 'updatedAt';

  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  // Date filtering
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  fromDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  toDate?: Date;

  // Platform filtering
  @IsString()
  @IsOptional()
  platform?: TPlatformNamesKeys | 'all';

  // Access type filtering
  @IsEnum(AccessType)
  @IsOptional()
  accessType?: AccessType;
}