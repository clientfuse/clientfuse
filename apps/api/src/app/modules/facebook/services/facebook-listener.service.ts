import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmittedEvent, EventType, IFacebookAuthEvent } from '../../../core/modules/event-bus/event-bus.model';
import { FacebookAccounts } from '../classes/facebook-accounts.class';

@Injectable()
export class FacebookListenerService {
  private readonly logger = new Logger(FacebookListenerService.name);

  @OnEvent(EventType.AUTH_REGISTER_FACEBOOK)
  @OnEvent(EventType.AUTH_LOGIN_FACEBOOK)
  async handleFacebookAuthEvent(event: EmittedEvent<IFacebookAuthEvent>) {
    this.logger.log(`Handling ${event.type} event for user ${event.payload.userId}`);
    const facebookAccounts = new FacebookAccounts(event.payload.facebookAccessToken);
    const { data } = await facebookAccounts.getUserAccountsData();
    console.log(data);
  }

}
