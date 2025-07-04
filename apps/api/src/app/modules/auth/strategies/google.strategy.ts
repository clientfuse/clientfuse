import { ApiEnv } from '@connectly/models';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy as OAuth2Strategy } from 'passport-google-oauth20';

export type IGoogleUser = {
  googleId: string;
  firstName: string;
  lastName: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(OAuth2Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService
  ) {
    super({
      clientID: configService.get(ApiEnv.GOOGLE_CLIENT_ID),
      clientSecret: configService.get(ApiEnv.GOOGLE_CLIENT_SECRET),
      callbackURL: configService.get(ApiEnv.GOOGLE_CALLBACK_URL),
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/user.birthday.read',
        'https://www.googleapis.com/auth/user.phonenumbers.read',
        'https://www.googleapis.com/auth/tagmanager.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly',
        'openid',
        'https://www.googleapis.com/auth/tagmanager.manage.users',
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/content',
        'https://www.googleapis.com/auth/analytics.manage.users',
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/adwords'
      ]
    });
  }

  authorizationParams(): { [key: string]: string; } {
    return ({
      access_type: 'offline'
    });
  };

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function
  ): Promise<any> {
    const user = {
      googleId: profile.id,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      email: profile.emails[0].value,
      accessToken,
      refreshToken
    };

    done(null, user);
  }
}
