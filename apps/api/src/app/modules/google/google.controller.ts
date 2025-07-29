import { ApiEnv, ENDPOINTS, ServerErrorCode } from '@connectly/models';
import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { GoogleAccounts } from './classes/google-accounts.class';

@Controller(ENDPOINTS.google.root)
export class GoogleController {

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {

  }

  /**
   * This endpoint is for TESTING purposes only.
   * Fetches user accounts data from Google using the user's access token.
   */
  @Get(ENDPOINTS.google.userAccountsData)
  async getUserAccountsData(@Query() query: { userId: string }) {
    const user = await this.usersService.findUser({ _id: query.userId });
    if (!user) {
      throw new NotFoundException(ServerErrorCode.USER_NOT_FOUND);
    }
    const googleAccounts = new GoogleAccounts(
      this.configService.get(ApiEnv.GOOGLE_CLIENT_ID),
      this.configService.get(ApiEnv.GOOGLE_CLIENT_SECRET),
      this.configService.get(ApiEnv.GOOGLE_CALLBACK_URL),
      this.configService.get(ApiEnv.GOOGLE_ADS_DEVELOPER_TOKEN)
    );
    googleAccounts.setCredentials({
      access_token: user.google.accessToken,
      refresh_token: user.google.refreshToken
    });
    return googleAccounts.getUserAccountsData();
  }

}
