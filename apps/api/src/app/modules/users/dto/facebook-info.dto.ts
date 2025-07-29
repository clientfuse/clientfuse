import { IsOptional, IsString, IsDefined, IsArray } from 'class-validator';
import { IFacebookInfo } from '@connectly/models';

export class FacebookInfoDto implements IFacebookInfo {
  @IsString()
  @IsOptional()
  accessToken: string | null;

  @IsArray()
  @IsDefined()
  @IsString({ each: true })
  grantedScopes: string[];

  @IsString()
  @IsOptional()
  userId: string | null;
}

