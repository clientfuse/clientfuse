import { ENDPOINTS } from '@connectly/models';
import { generateStrongPassword } from '@connectly/utils';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DateTime } from 'luxon';
import { Observable, take } from 'rxjs';
import { IAccessToken } from '@connectly/models';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { IGoogleUser } from './strategies/google.strategy';

export class LoginDto { // todo temp
  email: string;
  password: string;
}

@Controller(ENDPOINTS.auth.root)
export class AuthController {

  constructor(
    private authService: AuthService
  ) {
  }

  getRedirectUrl(token: string): string {
    return `http://localhost:4200/?token=${token}`;
  }

  @Get(ENDPOINTS.auth.google.root)
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() _req) {
    // Initiates the Google OAuth2 login flow
  }

  @Get(ENDPOINTS.auth.google.callback)
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user as IGoogleUser;

    if (!user) {
      res.redurect(this.getRedirectUrl(null));
    }

    this.authService.register({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: generateStrongPassword(),
      registrationDate: DateTime.now().toUnixInteger(),
      googleId: user.googleId
    })
      .pipe(take(1))
      .subscribe((token: IAccessToken) => {
        res.redirect(this.getRedirectUrl(token.access_token));
      });
  }

  @Get(ENDPOINTS.auth.facebook.root)
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin(): Promise<void> {
    // Initiates the Facebook OAuth2 login flow
  }

  @Get(ENDPOINTS.auth.facebook.callback)
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginRedirect(@Req() req): Promise<any> {
    // Handles the Facebook OAuth2 callback and returns user info
    return {
      statusCode: 200,
      data: req.user
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post(ENDPOINTS.auth.login)
  login(@Body() credentials: LoginDto): Observable<IAccessToken> {
    return this.authService.login(credentials, false);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(ENDPOINTS.auth.register)
  register(@Body() credentials: CreateUserDto) {
    return this.authService.register(credentials);
  }
}
