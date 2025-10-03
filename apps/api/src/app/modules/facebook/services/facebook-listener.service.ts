import { IFacebookInfo } from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EmittedEvent,
  EventType,
  IFacebookAccountsDataUpdatedEvent,
  IFacebookAuthEvent
} from '../../../core/modules/event-bus/event-bus.model';
import { EventBusService } from '../../../core/modules/event-bus/event-bus.service';
import { UsersService } from '../../users/users.service';
import { FacebookAccounts } from '../classes/facebook-accounts.class';

@Injectable()
export class FacebookListenerService {
  private readonly logger = new Logger(FacebookListenerService.name);

  constructor(
    private userService: UsersService,
    private eventBusService: EventBusService
  ) {
  }

  @OnEvent(EventType.AUTH_REGISTER_FACEBOOK)
  @OnEvent(EventType.AUTH_LOGIN_FACEBOOK)
  async handleFacebookAuthEvent(event: EmittedEvent<IFacebookAuthEvent>) {
    try {
      this.logger.log(`${event.correlationId} Handling ${event.type} event for user ${event.payload.userId}`);
      const facebookAccounts = new FacebookAccounts(event.payload.facebookAccessToken);
      const { data } = await facebookAccounts.getUserAccountsData();
      const foundUser = await this.userService.findUser({ _id: event.payload.userId });

      if (!foundUser) {
        this.logger.error(`User ${event.payload.userId} not found`);
        return;
      }
      const facebookInfo: IFacebookInfo = {
        ...foundUser.facebook,
        grantedScopes: data.grantedScopes || [],
        adsAccounts: data.facebookAdAccounts || [],
        businessAccounts: data.facebookBusinessAccounts || [],
        pages: data.facebookPages || [],
        catalogs: data.facebookCatalogs || [],
        pixels: data.facebookPixels || [],
        email: data.facebookEmail || foundUser.facebook.email || null,
        userId: data.facebookUserId || foundUser.facebook.userId || null
      };

      await this.userService.updateUser(
        event.payload.userId,
        { facebook: facebookInfo }
      );

      this.logger.log(`Successfully updated Facebook data for user ${event.payload.userId}`);
      this.logger.log(`Updated data summary:
        - Ad Accounts: ${facebookInfo.adsAccounts.length}
        - Business Accounts: ${facebookInfo.businessAccounts.length}
        - Pages: ${facebookInfo.pages.length}
        - Catalogs: ${facebookInfo.catalogs.length}
        - Pixels: ${facebookInfo.pixels.length}
        - Granted Scopes: ${facebookInfo.grantedScopes.length}
      `);

      await this.eventBusService.emitAsync<IFacebookAccountsDataUpdatedEvent>(
        EventType.USER_FACEBOOK_ACCOUNTS_DATA_UPDATED,
        { userId: event.payload.userId },
        FacebookListenerService.name,
        event.correlationId
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle Facebook auth event for user ${event.payload.userId}:`,
        error
      );
    }
  }
}
