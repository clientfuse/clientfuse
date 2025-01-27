import { IAccessToken, IUserResponse, LocalStorageKey, ServerErrorCode } from '@connectly/models';
import { generateStrongPassword } from '@connectly/utils';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptJs from 'bcryptjs';
import { DateTime } from 'luxon';
import { from, map, Observable, switchMap } from 'rxjs';
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
  ) {
  }

  login(credentials: LoginDto): Observable<IAccessToken> {
    return this.usersService.findUserWithPassword({email: credentials.email})
      .pipe(
        switchMap((user) => {
          if (!user) {
            throw new UnauthorizedException(ServerErrorCode.INCORRECT_USER_OR_PASSWORD);
          }

          return this.checkPassword(credentials.password, user.password)
            .pipe(
              map((isPasswordCorrect: boolean) => {
                if (!isPasswordCorrect) {
                  throw new UnauthorizedException(ServerErrorCode.INCORRECT_USER_OR_PASSWORD);
                }
                return this.generateAccessToken(user);
              })
            );

        })
      );
  }

  loginWithGoogle(user: IGoogleUser): Observable<IAccessToken> {
    return this.usersService.findUser({email: user.email})
      .pipe(
        switchMap((foundUser) => {
          if (foundUser) {
            return this.usersService.updateUser(foundUser._id, {
              googleUserId: user.googleId,
              googleAccessToken: user.accessToken,
              isLoggedInWithGoogle: true
            })
              .pipe(map(() => this.generateAccessToken(foundUser)));
          }

          return this.register({
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
            isLoggedInWithFacebook: false
          })
            .pipe(map((createdUser) => this.generateAccessToken(createdUser)));
        })
      );
  }

  loginWithFacebook(user: IFacebookUser): Observable<IAccessToken> {
    return this.usersService.findUser({email: user.email})
      .pipe(
        switchMap((foundUser) => {
          if (foundUser) {
            return this.usersService.updateUser(foundUser._id, {
              facebookUserId: user.facebookUserId,
              facebookAccessToken: user.accessToken,
              isLoggedInWithFacebook: true
            })
              .pipe(map(() => this.generateAccessToken(foundUser)));
          }

          return this.register({
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
            isLoggedInWithFacebook: true
          })
            .pipe(map((createdUser) => this.generateAccessToken(createdUser)));
        })
      );
  }

  register(credentials: CreateUserDto) {
    return this.usersService.findUser({email: credentials.email})
      .pipe(
        switchMap(user => {
          if (user) throw new BadRequestException(ServerErrorCode.USER_ALREADY_EXISTS);

          return encryptPassword(credentials.password)
            .pipe(switchMap((encryptedPassword: string) => this.usersService.createUser({...credentials, password: encryptedPassword})));
        })
      );
  }

  private checkPassword(
    password: string,
    hashedPassword: string
  ): Observable<boolean> {
    return from(bcryptJs.compare(password, hashedPassword));
  }

  private generateAccessToken(user: IUserResponse): IAccessToken {
    const payload = {sub: user};
    return {[LocalStorageKey.ACCESS_TOKEN]: this.jwtService.sign(payload)};
  }
}
