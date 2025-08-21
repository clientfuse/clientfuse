import { IsString, IsNotEmpty } from 'class-validator';
import { IGoogleConnectionDto } from '@clientfuse/models';

export class GoogleConnectionDto implements IGoogleConnectionDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
