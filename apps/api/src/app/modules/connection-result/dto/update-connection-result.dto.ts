import { PartialType } from '@nestjs/mapped-types';
import { CreateConnectionResultDto } from './create-connection-result.dto';

export class UpdateConnectionResultDto extends PartialType(CreateConnectionResultDto) {}