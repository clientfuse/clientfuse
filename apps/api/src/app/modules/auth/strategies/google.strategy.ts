import { ApiEnv } from '@connectly/models';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { OAuth2Strategy, Profile } from 'passport-google-oauth';

export type IGoogleUser = {
  googleId: string;
  firstName: string;
  lastName: string;
  email: string;
  accessToken: string;
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
        'email',
        'profile',
        'https://www.googleapis.com/auth/user.birthday.read',
        'https://www.googleapis.com/auth/user.phonenumbers.read'
      ]
    });
  }

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
      accessToken
    };

    done(null, user);
  }
}
