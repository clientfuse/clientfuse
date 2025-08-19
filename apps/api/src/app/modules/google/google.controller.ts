import { ApiEnv, ENDPOINTS, ServerErrorCode } from '@clientfuse/models';
import { Body, Controller, Get, NotFoundException, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsString } from 'class-validator';
import { Public } from '../auth/decorators/is-public.decorator';
import { UsersService } from '../users/users.service';
import { GoogleAccounts } from './classes/google-accounts.class';

export class GoogleConnectionsDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

@Controller(ENDPOINTS.google.root)
export class GoogleController {

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {
  }

  @Public()
  @Post(ENDPOINTS.google.connect)
  async connections(@Body() body: GoogleConnectionsDto) {
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
