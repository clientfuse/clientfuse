import { IAgencyBase, IWhiteLabelingConfig } from '@clientfuse/models';
import { IsDefined, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateAgencyDto implements IAgencyBase {
  @IsString()
  @IsDefined()
  userId: string;

  @IsEmail()
  @IsString()
  @IsDefined()
  email: string;

  @IsOptional()
  whiteLabeling: IWhiteLabelingConfig;
}
