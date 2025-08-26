import { IsString, IsNotEmpty } from 'class-validator';
import { IGetEntityUsersQueryDto } from '@clientfuse/models';

export class GetEntityUsersQueryDto implements IGetEntityUsersQueryDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}