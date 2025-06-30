import {
  IAccessToken,
  IUserResponse,
  LocalStorageKey,
  ServerErrorCode,
} from '@connectly/models';
import { generateStrongPassword } from '@connectly/utils';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptJs from 'bcryptjs';
import { DateTime } from 'luxon';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { encryptPassword } from '../users/utils/user.utils';
import { LoginDto } from './dto/login.dto';
import { IFacebookUser } from './strategies/facebook.strategy';
import { IGoogleUser } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService
  ) {}

  async login(credentials: LoginDto): Promise<IAccessToken> {
    const user = await this.usersService.findUserWithPassword({
      email: credentials.email,
    });

    if (!user) {
      throw new UnauthorizedException(
        ServerErrorCode.INCORRECT_USER_OR_PASSWORD
      );
    }

    const isPasswordCorrect = await this.checkPassword(
      credentials.password,
      user.password
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedException(
        ServerErrorCode.INCORRECT_USER_OR_PASSWORD
      );
    }

    return this.generateAccessToken(user);
  }

  async loginWithGoogle(user: IGoogleUser): Promise<IAccessToken> {
    const foundUser = await this.usersService.findUser({ email: user.email });

    if (foundUser) {
      await this.usersService.updateUser(foundUser._id, {
        googleUserId: user.googleId,
        googleAccessToken: user.accessToken,
        isLoggedInWithGoogle: true,
      });

      return this.generateAccessToken(foundUser);
    }

    const createdUser = await this.register({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: generateStrongPassword(),
      registrationDate: DateTime.now().toUnixInteger(),
      birthDate: null,
      lastSeenDate: null,
      phone: null,
      googleUserId: user.googleId,
      googleAccessToken: user.accessToken,
      googleAdsAccounts: [],
      googleGrantedScopes: [],
      googleMerchantCenters: [],
      googleSearchConsoles: [],
      googleMyBusinessLocations: [],
      googleMyBusinessAccounts: [],
      googleTagManagerAccounts: [],
      facebookGrantedScopes: [],
      facebookUserId: null,
      facebookAccessToken: null,
      isLoggedInWithGoogle: true,
      isLoggedInWithFacebook: false,
    });

    return this.generateAccessToken(createdUser);
  }

  async loginWithFacebook(user: IFacebookUser): Promise<IAccessToken> {
    const foundUser = await this.usersService.findUser({ email: user.email });

    if (foundUser) {
      await this.usersService.updateUser(foundUser._id, {
        facebookUserId: user.facebookUserId,
        facebookAccessToken: user.accessToken,
        isLoggedInWithFacebook: true,
      });

      return this.generateAccessToken(foundUser);
    }

    const createdUser = await this.register({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: generateStrongPassword(),
      registrationDate: DateTime.now().toUnixInteger(),
      birthDate: null,
      lastSeenDate: null,
      phone: null,
      googleUserId: null,
      googleAccessToken: null,
      googleAdsAccounts: [],
      googleGrantedScopes: [],
      googleMerchantCenters: [],
      googleSearchConsoles: [],
      googleMyBusinessLocations: [],
      googleMyBusinessAccounts: [],
      googleTagManagerAccounts: [],
      facebookGrantedScopes: [],
      facebookUserId: user.facebookUserId,
      facebookAccessToken: user.accessToken,
      isLoggedInWithGoogle: false,
      isLoggedInWithFacebook: true,
    });

    return this.generateAccessToken(createdUser);
  }

  async register(credentials: CreateUserDto): Promise<IUserResponse> {
    const existingUser = await this.usersService.findUser({
      email: credentials.email,
    });

    if (existingUser) {
      throw new BadRequestException(ServerErrorCode.USER_ALREADY_EXISTS);
    }

    const encryptedPassword = await encryptPassword(credentials.password);
    return await this.usersService.createUser({
      ...credentials,
      password: encryptedPassword,
    });
  }

  private async checkPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcryptJs.compare(password, hashedPassword);
  }

  private generateAccessToken(user: IUserResponse): IAccessToken {
    const payload = { sub: user };
    return { [LocalStorageKey.ACCESS_TOKEN]: this.jwtService.sign(payload) };
  }
}

