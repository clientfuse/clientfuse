import { IGetEntityUsersQueryDto } from '@clientfuse/models';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GetEntityUsersQueryDto implements IGetEntityUsersQueryDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsOptional()
  agencyId?: string;
}