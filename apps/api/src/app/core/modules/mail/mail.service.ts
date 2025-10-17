import { ApiEnv, ServerErrorCode } from '@clientfuse/models';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import type { Interfaces, MessagesSendResult } from 'mailgun.js/definitions';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private TESTING_EMAIL = 'support@clientfuse.io';
  private _mailgun = new Mailgun(FormData);
  private _client: Interfaces.IMailgunClient = this._mailgun.client({
    username: 'api',
    key: this.configService.get(ApiEnv.MAILGUN_API_KEY)
  });

  constructor(private configService: ConfigService) {
  }

  async sendMail(to: string, subject: string, html: string): Promise<MessagesSendResult> {
    try {
      // Uncomment the line below to send emails to TESTING_EMAIL in DEV environment
      // const toMail = this.configService.get(ApiEnv.ENV) === EnvMode.DEV || to.endsWith('@clientfuse.io') ? this.TESTING_EMAIL : to;
      const toMail = to.endsWith('@clientfuse.io') ? this.TESTING_EMAIL : to;
      const message: Promise<MessagesSendResult> = this._client.messages.create(
        this.configService.get(ApiEnv.MAILGUN_DOMAIN),
        {
          from: 'Clientfuse <support@clientfuse.io>',
          to: toMail,
          subject,
          html
        });
      this.logger.log(`Email sent to ${toMail} with subject: "${subject}"`);

      return message;
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
      throw new BadRequestException(ServerErrorCode.FAILED_TO_SEND_EMAIL);
    }
  }
}
