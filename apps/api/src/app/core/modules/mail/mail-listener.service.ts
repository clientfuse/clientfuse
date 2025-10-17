import { Injectable, Logger } from '@nestjs/common';
import { MailService } from './mail.service';

@Injectable()
export class MailListenerService {
  private readonly logger = new Logger(MailListenerService.name);

  constructor(private mailService: MailService) {}
}
