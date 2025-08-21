import { IsString, IsNotEmpty } from 'class-validator';
import { IGetUserAccountsDto } from '@clientfuse/models';

export class GetUserAccountsDto implements IGetUserAccountsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}