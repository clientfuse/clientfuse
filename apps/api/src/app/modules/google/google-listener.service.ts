import { ApiEnv } from '@connectly/models';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { EmittedEvent, EventType, IGoogleAuthEvent } from '../../core/modules/event-bus/event-bus.model';
import { UsersService } from '../users/users.service';
import { GoogleAccounts } from './google-accounts.class';
import { getGoogleTokenExpirationDate } from './utils/google.utils';

@Injectable()
export class GoogleListenerService {
  private readonly logger = new Logger(GoogleListenerService.name);
  private readonly googleClientId = this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_ID);
  private readonly googleClientSecret = this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_SECRET);
  private readonly googleCallbackUrl = this.configService.get<string>(ApiEnv.GOOGLE_CALLBACK_URL);

  constructor(
    private userService: UsersService,
    private readonly configService: ConfigService
  ) {
  }

  @OnEvent(EventType.AUTH_REGISTER_GOOGLE)
  @OnEvent(EventType.AUTH_LOGIN_GOOGLE)
  async handleGoogleAuthEvent(event: EmittedEvent<IGoogleAuthEvent>) {
    this.logger.log(`Handling ${event.type} event for user ${event.payload.userId}`);
    const googleAccounts = new GoogleAccounts(
      this.googleClientId,
      this.googleClientSecret,
      this.googleCallbackUrl
    );
    googleAccounts.setCredentials({
      access_token: event.payload.googleAccessToken,
      refresh_token: event.payload.googleRefreshToken
    });
    const data = await googleAccounts.getUserAccountsData();
    await this.userService.updateUser(
      event.payload.userId,
      {
        googleAnalyticsAccounts: data.data.googleAnalyticsAccounts,
        googleTagManagers: data.data.googleTagManagers,
        googleSearchConsoles: data.data.googleSearchConsoles,
        googleGrantedScopes: data.data.googleGrantedScopes,
        googleAccessToken: data.tokens.access_token,
        googleRefreshToken: data.tokens.refresh_token,
        googleTokenExpirationDate: getGoogleTokenExpirationDate(data.tokens.expiry_date)
      }
    );
  }

}
