import { ApiEnv, IGoogleInfo } from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EmittedEvent,
  EventType,
  IGoogleAccountsDataUpdatedEvent,
  IGoogleAuthEvent
} from '../../../core/modules/event-bus/event-bus.model';
import { EventBusService } from '../../../core/modules/event-bus/event-bus.service';
import { UsersService } from '../../users/users.service';
import { GoogleAccounts } from '../classes/google-accounts.class';
import { getGoogleTokenExpirationDate } from '../utils/google.utils';

@Injectable()
export class GoogleListenerService {
  private readonly logger = new Logger(GoogleListenerService.name);
  private readonly googleClientId = this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_ID);
  private readonly googleClientSecret = this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_SECRET);
  private readonly googleCallbackUrl = this.configService.get<string>(ApiEnv.GOOGLE_CALLBACK_URL);
  private readonly googleAdsDeveloperToken = this.configService.get<string>(ApiEnv.GOOGLE_ADS_DEVELOPER_TOKEN);

  constructor(
    private userService: UsersService,
    private readonly configService: ConfigService,
    private eventBusService: EventBusService
  ) {
  }

  @OnEvent(EventType.AUTH_REGISTER_GOOGLE)
  @OnEvent(EventType.AUTH_LOGIN_GOOGLE)
  async handleGoogleAuthEvent(event: EmittedEvent<IGoogleAuthEvent>) {
    try {
      this.logger.log(`${event.correlationId} Handling ${event.type} event for user ${event.payload.userId}`);
      const googleAccounts = new GoogleAccounts(
        this.googleClientId,
        this.googleClientSecret,
        this.googleCallbackUrl,
        this.googleAdsDeveloperToken
      );
      googleAccounts.setCredentials({
        access_token: event.payload.googleAccessToken,
        refresh_token: event.payload.googleRefreshToken
      });
      const { data, tokens } = await googleAccounts.getUserAccountsData();
      const foundUser = await this.userService.findUser({ _id: event.payload.userId });

      if (!foundUser) {
        this.logger.error(`User ${event.payload.userId} not found`);
        return;
      }

      const googleInfo: IGoogleInfo = {
        ...foundUser.google,
        analyticsAccounts: data.googleAnalyticsAccounts,
        tagManagers: data.googleTagManagers,
        searchConsoles: data.googleSearchConsoles,
        merchantCenters: data.googleMerchantCenters,
        myBusinessAccounts: data.googleMyBusinessAccounts,
        myBusinessLocations: data.googleMyBusinessLocations,
        grantedScopes: data.googleGrantedScopes,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpirationDate: getGoogleTokenExpirationDate(tokens.expiry_date)
      };

      await this.userService.updateUser(
        event.payload.userId,
        { google: googleInfo }
      );

      this.logger.log(`Successfully updated Google data for user ${event.payload.userId}`);
      this.logger.log(`Updated data summary:
        - Analytics Accounts: ${googleInfo.analyticsAccounts?.length || 0}
        - Tag Managers: ${googleInfo.tagManagers?.length || 0}
        - Search Consoles: ${googleInfo.searchConsoles?.length || 0}
        - Merchant Centers: ${googleInfo.merchantCenters?.length || 0}
        - My Business Accounts: ${googleInfo.myBusinessAccounts?.length || 0}
        - My Business Locations: ${googleInfo.myBusinessLocations?.length || 0}
        - Granted Scopes: ${googleInfo.grantedScopes?.length || 0}
      `);

      this.eventBusService.emit<IGoogleAccountsDataUpdatedEvent>(
        EventType.GOOGLE_ACCOUNTS_DATA_UPDATED,
        { userId: event.payload.userId },
        GoogleListenerService.name,
        event.correlationId
      );

    } catch (error) {
      this.logger.error(
        `Failed to handle Google auth event for user ${event.payload.userId}:`,
        error
      );
    }
  }
}
