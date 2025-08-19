import { ApiEnv, FACEBOOK_SCOPES } from '@clientfuse/models';
import { getNoEmailPlaceholder } from '@clientfuse/utils';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';

export type IFacebookUser = {
  email: string;
  firstName: string;
  lastName: string;
  userId: string;
  accessToken: string;
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly configService: ConfigService
  ) {
    super({
      clientID: configService.get(ApiEnv.FACEBOOK_CLIENT_ID),
      clientSecret: configService.get(ApiEnv.FACEBOOK_CLIENT_SECRET),
      callbackURL: configService.get(ApiEnv.FACEBOOK_CALLBACK_URL),
      scope: FACEBOOK_SCOPES,
      profileFields: ['emails', 'name']
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function
  ): Promise<any> {
    const { name, emails } = profile;
    const user: IFacebookUser = {
      email: emails?.[0]?.value || getNoEmailPlaceholder(),
      firstName: name.givenName,
      lastName: name.familyName,
      userId: profile.id,
      accessToken
    };
    done(null, user);
  }
}
