import { IsString, IsNotEmpty } from 'class-validator';
import { IFacebookConnectionDto } from '@clientfuse/models';

export class FacebookConnectionDto implements IFacebookConnectionDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}