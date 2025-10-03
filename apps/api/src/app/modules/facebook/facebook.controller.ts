import { EMPTY_FACEBOOK_INFO, ENDPOINTS, IFacebookConnectionResponse, IFacebookInfo, ServerErrorCode } from '@clientfuse/models';
import { canDisconnectPlatform } from '@clientfuse/utils';
import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import { EventType, IIntegrationFacebookConnectedEvent, IIntegrationFacebookDisconnectedEvent } from '../../core/modules/event-bus/event-bus.model';
import { EventBusService } from '../../core/modules/event-bus/event-bus.service';
import { Public } from '../auth/decorators/is-public.decorator';
import { UsersService } from '../users/users.service';
import { FacebookAccounts } from './classes/facebook-accounts.class';
import { FacebookConnectionDto } from './dto';

@Controller(ENDPOINTS.facebook.root)
export class FacebookController {

  constructor(
    private readonly usersService: UsersService,
    private readonly eventBusService: EventBusService
  ) {
  }

  @Public()
  @Post(ENDPOINTS.facebook.connectExternal)
  async connectExternal(@Body() body: FacebookConnectionDto): Promise<IFacebookConnectionResponse> {
    const facebookAccounts = new FacebookAccounts(body.accessToken);

    const response: IFacebookConnectionResponse = {
      user: {
        id: '',
        email: ''
      },
      hasValidTokens: false,
      requiresReauth: false,
      accounts: null
    };

    try {
      const userInfo = await facebookAccounts.getUserInfo();
      response.user = {
        id: userInfo.id,
        email: userInfo.email
      };
      response.hasValidTokens = true;

      try {
        const accountsData = await facebookAccounts.getUserAccountsData();
        response.accounts = accountsData.data;
      } catch (error) {
        console.error('Failed to fetch Facebook accounts data:', error);
        response.requiresReauth = true;
      }
    } catch (error) {
      console.error('Failed to get Facebook user info:', error);
      response.requiresReauth = true;
    }

    return response;
  }

  @Post(ENDPOINTS.facebook.connectInternal)
  async connectInternal(@Req() req, @Body() body: FacebookConnectionDto): Promise<{ message: string }> {
    const userId: string = req.user._id;

    const user = await this.usersService.findUser({ _id: userId });

    if (!user) {
      throw new BadRequestException(ServerErrorCode.USER_NOT_FOUND);
    }

    const facebookAccounts = new FacebookAccounts(body.accessToken);

    try {
      await facebookAccounts.getUserInfo();
    } catch (error) {
      throw new BadRequestException('Invalid or expired Facebook access token. Please re-authenticate.');
    }

    const { data } = await facebookAccounts.getUserAccountsData();

    const facebookInfo: IFacebookInfo = {
      ...user.facebook,
      grantedScopes: data.grantedScopes || [],
      adsAccounts: data.facebookAdAccounts || [],
      businessAccounts: data.facebookBusinessAccounts || [],
      pages: data.facebookPages || [],
      catalogs: data.facebookCatalogs || [],
      pixels: data.facebookPixels || [],
      accessToken: body.accessToken,
      email: data.facebookEmail || user.facebook.email || null,
      userId: data.facebookUserId || user.facebook.userId || null
    };

    await this.usersService.updateUser(userId, {
      facebook: facebookInfo,
      isLoggedInWithFacebook: true
    });

    await this.eventBusService.emitAsync<IIntegrationFacebookConnectedEvent>(
      EventType.FACEBOOK_CONNECTED_INTERNAL,
      { userId },
      FacebookController.name
    );

    return { message: 'Facebook account connected successfully' };
  }

  @Post(ENDPOINTS.facebook.disconnectInternal)
  async disconnectInternal(@Req() req): Promise<{ message: string }> {
    const userId: string = req.user._id;

    const user = await this.usersService.findUser({ _id: userId });

    if (!user) {
      throw new BadRequestException(ServerErrorCode.USER_NOT_FOUND);
    }

    if (!canDisconnectPlatform(user)) {
      throw new BadRequestException('Cannot disconnect Facebook account. At least one authentication method must remain active.');
    }

    await this.usersService.updateUser(userId, {
      facebook: EMPTY_FACEBOOK_INFO,
      isLoggedInWithFacebook: false
    });

    await this.eventBusService.emitAsync<IIntegrationFacebookDisconnectedEvent>(
      EventType.FACEBOOK_DISCONNECTED_INTERNAL,
      { userId },
      FacebookController.name
    );

    return { message: 'Facebook account disconnected successfully' };
  }
}
