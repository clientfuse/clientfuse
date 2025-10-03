import { ApiEnv, EMPTY_GOOGLE_INFO, ENDPOINTS, IGoogleConnectionResponse, IGoogleInfo, ServerErrorCode } from '@clientfuse/models';
import { canDisconnectPlatform } from '@clientfuse/utils';
import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventType, IIntegrationGoogleConnectedEvent, IIntegrationGoogleDisconnectedEvent } from '../../core/modules/event-bus/event-bus.model';
import { EventBusService } from '../../core/modules/event-bus/event-bus.service';
import { Public } from '../auth/decorators/is-public.decorator';
import { UsersService } from '../users/users.service';
import { GoogleAccounts } from './classes/google-accounts.class';
import { GoogleConnectionDto } from './dto';
import { getGoogleTokenExpirationDate } from './utils/google.utils';

@Controller(ENDPOINTS.google.root)
export class GoogleController {

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly eventBusService: EventBusService
  ) {
  }

  @Public()
  @Post(ENDPOINTS.google.connectExternal)
  async connectExternal(@Body() body: GoogleConnectionDto): Promise<IGoogleConnectionResponse> {
    const googleAccounts = new GoogleAccounts(
      this.configService.get(ApiEnv.GOOGLE_CLIENT_ID),
      this.configService.get(ApiEnv.GOOGLE_CLIENT_SECRET),
      this.configService.get(ApiEnv.GOOGLE_CALLBACK_URL),
      this.configService.get(ApiEnv.GOOGLE_ADS_DEVELOPER_TOKEN)
    );

    const loginResult = await googleAccounts.verifyAndInitialize(body.idToken, { access_token: body.accessToken });

    const response = {
      user: loginResult.user,
      hasValidTokens: loginResult.hasValidTokens,
      requiresReauth: loginResult.requiresReauth,
      accounts: null
    };

    if (loginResult.hasValidTokens) {
      try {
        const accountsData = await googleAccounts.getUserAccountsData(true);
        response.accounts = accountsData.data;
      } catch (error) {
        console.error('Failed to fetch accounts data:', error);
        response.requiresReauth = true;
      }
    }

    return response;
  }

  @Post(ENDPOINTS.google.connectInternal)
  async connectInternal(@Req() req, @Body() body: GoogleConnectionDto): Promise<{ message: string }> {
    const userId: string = req.user._id;

    const user = await this.usersService.findUser({ _id: userId });

    if (!user) {
      throw new BadRequestException(ServerErrorCode.USER_NOT_FOUND);
    }

    const googleAccounts = new GoogleAccounts(
      this.configService.get(ApiEnv.GOOGLE_CLIENT_ID),
      this.configService.get(ApiEnv.GOOGLE_CLIENT_SECRET),
      this.configService.get(ApiEnv.GOOGLE_CALLBACK_URL),
      this.configService.get(ApiEnv.GOOGLE_ADS_DEVELOPER_TOKEN)
    );

    const loginResult = await googleAccounts.verifyAndInitialize(body.idToken, { access_token: body.accessToken });

    if (!loginResult.hasValidTokens) {
      throw new BadRequestException('Invalid or expired Google tokens. Please re-authenticate.');
    }

    const { data, tokens } = await googleAccounts.getUserAccountsData(true);

    const googleInfo: IGoogleInfo = {
      ...user.google,
      analyticsAccounts: data.googleAnalyticsAccounts,
      adsAccounts: data.googleAdsAccounts,
      tagManagers: data.googleTagManagers,
      searchConsoles: data.googleSearchConsoles,
      merchantCenters: data.googleMerchantCenters,
      myBusinessAccounts: data.googleMyBusinessAccounts,
      myBusinessLocations: data.googleMyBusinessLocations,
      grantedScopes: data.googleGrantedScopes,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpirationDate: getGoogleTokenExpirationDate(tokens.expiry_date),
      email: data.googleEmail || user.google.email || null,
      userId: data.googleUserId || user.google.userId || null
    };

    await this.usersService.updateUser(userId, {
      google: googleInfo,
      isLoggedInWithGoogle: true
    });

    await this.eventBusService.emitAsync<IIntegrationGoogleConnectedEvent>(
      EventType.GOOGLE_CONNECTED_INTERNAL,
      { userId },
      GoogleController.name
    );

    return { message: 'Google account connected successfully' };
  }

  @Post(ENDPOINTS.google.disconnectInternal)
  async disconnectInternal(@Req() req): Promise<{ message: string }> {
    const userId: string = req.user._id;

    const user = await this.usersService.findUser({ _id: userId });

    if (!user) {
      throw new BadRequestException(ServerErrorCode.USER_NOT_FOUND);
    }

    if (!canDisconnectPlatform(user)) {
      throw new BadRequestException('Cannot disconnect Google account. At least one authentication method must remain active.');
    }

    await this.usersService.updateUser(userId, {
      google: EMPTY_GOOGLE_INFO,
      isLoggedInWithGoogle: false
    });

    await this.eventBusService.emitAsync<IIntegrationGoogleDisconnectedEvent>(
      EventType.GOOGLE_DISCONNECTED_INTERNAL,
      { userId },
      GoogleController.name
    );

    return { message: 'Google account disconnected successfully' };
  }
}
