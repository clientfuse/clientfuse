import { PartialType } from '@nestjs/mapped-types';
import { CreateConnectionLinkDto } from './create-connection-link.dto';

export class UpdateConnectionLinkDto extends PartialType(CreateConnectionLinkDto) {}