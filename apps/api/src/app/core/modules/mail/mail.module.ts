import { Global, Module } from '@nestjs/common';
import { MailListenerService } from './mail-listener.service';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [MailService, MailListenerService],
  exports: [MailService]
})
export class MailModule {
}
