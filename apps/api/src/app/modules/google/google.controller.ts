import { ApiEnv, ENDPOINTS, IGoogleConnectionResponse } from '@clientfuse/models';
import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/is-public.decorator';
import { UsersService } from '../users/users.service';
import { GoogleAccounts } from './classes/google-accounts.class';
import { GoogleConnectionDto } from './dto';

@Controller(ENDPOINTS.google.root)
export class GoogleController {

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {
  }

  @Public()
  @Post(ENDPOINTS.google.connect)
  async connections(@Body() body: GoogleConnectionDto): Promise<IGoogleConnectionResponse> {
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
}
