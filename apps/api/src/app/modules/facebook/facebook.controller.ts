import { ENDPOINTS, IFacebookConnectionResponse } from '@clientfuse/models';
import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/is-public.decorator';
import { FacebookAccounts } from './classes/facebook-accounts.class';
import { FacebookConnectionDto } from './dto';

@Controller(ENDPOINTS.facebook.root)
export class FacebookController {

  @Public()
  @Post(ENDPOINTS.facebook.connect)
  async connections(@Body() body: FacebookConnectionDto): Promise<IFacebookConnectionResponse> {
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
}