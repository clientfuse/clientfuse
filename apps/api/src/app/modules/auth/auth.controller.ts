import { ApiEnv, ENDPOINTS, IAccessToken } from '@clientfuse/models';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { Public } from './decorators/is-public.decorator';
import { LoginDto } from './dto/login.dto';
import { IFacebookUser } from './strategies/facebook.strategy';
import { IGoogleUser } from './strategies/google.strategy';

@Controller(ENDPOINTS.auth.root)
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {
  }

  @Public()
  @Get(ENDPOINTS.auth.google.root)
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Initiates the Google OAuth2 login flow
  }

  @Public()
  @Get(ENDPOINTS.auth.google.callback)
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user as IGoogleUser;

    if (!user) {
      res.redirect(this.getRedirectUrl(null));
      return;
    }

    try {
      const token = await this.authService.loginWithGoogle(user);
      res.redirect(this.getRedirectUrl(token.access_token));
    } catch (error) {
      res.redirect(this.getRedirectUrl(null));
    }
  }

  @Public()
  @Get(ENDPOINTS.auth.facebook.root)
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin(): Promise<void> {
    // Initiates the Facebook OAuth2 login flow
  }

  @Public()
  @Get(ENDPOINTS.auth.facebook.callback)
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginRedirect(@Req() req, @Res() res) {
    const user = req.user as IFacebookUser;

    if (!user) {
      res.redirect(this.getRedirectUrl(null));
      return;
    }

    try {
      const token = await this.authService.loginWithFacebook(user);
      res.redirect(this.getRedirectUrl(token.access_token));
    } catch (error) {
      res.redirect(this.getRedirectUrl(null));
    }
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(ENDPOINTS.auth.login)
  login(@Body() credentials: LoginDto): Promise<IAccessToken> {
    return this.authService.login(credentials);
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post(ENDPOINTS.auth.register)
  register(@Body() credentials: CreateUserDto) {
    return this.authService.register(credentials);
  }

  private getRedirectUrl(token: string): string {
    return `${this.configService.get(ApiEnv.CORS_ORIGIN)}/auth/login-callback?token=${token}`;
  }

  @HttpCode(HttpStatus.OK)
  @Post(ENDPOINTS.auth.updateEmail)
  async updateEmail(@Body() body: { email: string }, @Req() req) {
    const userId = req.user._id; // Assuming user ID is stored in the request object
    return this.authService.updateEmail(userId, body.email);
  }
}
