import { EMPTY_FACEBOOK_INFO, EMPTY_GOOGLE_INFO, IAccessToken, IUserResponse, LocalStorageKey, Role, ServerErrorCode } from '@clientfuse/models';
import { checkIfNoUserEmail, generateStrongPassword } from '@clientfuse/utils';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptJs from 'bcryptjs';
import { EventType, IFacebookAuthEvent, IGoogleAuthEvent, IUserEmailUpdatedEvent } from '../../core/modules/event-bus/event-bus.model';
import { EventBusService } from '../../core/modules/event-bus/event-bus.service';
import { AgenciesService } from '../agencies/services/agencies.service';
import { AgencyMergeService } from '../agencies/services/agency-merge.service';
import { getGoogleTokenExpirationDate } from '../google/utils/google.utils';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserMergeService } from '../users/user-merge.service';
import { UsersService } from '../users/users.service';
import { encryptPassword } from '../users/utils/user.utils';
import { LoginDto } from './dto/login.dto';
import { IFacebookUser } from './strategies/facebook.strategy';
import { IGoogleUser } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private userMergeService: UserMergeService,
    private eventBusService: EventBusService,
    private agenciesService: AgenciesService,
    private agencyMergeService: AgencyMergeService
  ) {
  }

  async login(credentials: LoginDto): Promise<IAccessToken> {
    const user = await this.usersService.findUserWithPassword({
      email: credentials.email
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
        google: {
          ...foundUser.google,
          userId: user.googleId,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken ?? foundUser.google.refreshToken,
          tokenExpirationDate: getGoogleTokenExpirationDate(null),
          email: user.email
        },
        isLoggedInWithGoogle: true
      });

      await this.eventBusService.emitAsync<IGoogleAuthEvent>(
        EventType.AUTH_LOGIN_GOOGLE,
        {
          userId: foundUser._id,
          googleAccessToken: user.accessToken,
          googleRefreshToken: user.refreshToken ?? foundUser.google.refreshToken
        },
        AuthService.name
      );

      return this.generateAccessToken(foundUser);
    }

    const createdUser = await this.register({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: generateStrongPassword(),
      birthDate: null,
      lastSeenDate: null,
      phone: null,
      google: {
        ...EMPTY_GOOGLE_INFO,
        userId: user.googleId,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        tokenExpirationDate: getGoogleTokenExpirationDate(null),
        email: user.email
      },
      facebook: EMPTY_FACEBOOK_INFO,
      isLoggedInWithGoogle: true,
      isLoggedInWithFacebook: false,
      role: Role.MANAGER
    });

    await this.eventBusService.emitAsync<IGoogleAuthEvent>(
      EventType.AUTH_REGISTER_GOOGLE,
      {
        userId: createdUser._id,
        googleAccessToken: user.accessToken,
        googleRefreshToken: user.refreshToken
      },
      AuthService.name
    );

    return this.generateAccessToken(createdUser);
  }

  async loginWithFacebook(user: IFacebookUser): Promise<IAccessToken> {
    const facebookEmail = checkIfNoUserEmail(user.email) ? null : user.email;
    const foundUser = await this.usersService.findUser({ 'facebook.userId': user.userId });

    if (foundUser) {
      await this.usersService.updateUser(foundUser._id, {
        facebook: {
          ...foundUser.facebook,
          userId: user.userId,
          accessToken: user.accessToken,
          email: facebookEmail
        },
        isLoggedInWithFacebook: true
      });

      await this.eventBusService.emitAsync<IFacebookAuthEvent>(
        EventType.AUTH_LOGIN_FACEBOOK,
        {
          userId: foundUser._id,
          facebookAccessToken: user.accessToken
        },
        AuthService.name
      );

      return this.generateAccessToken(foundUser);
    }

    const createdUser = await this.register({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: generateStrongPassword(),
      birthDate: null,
      lastSeenDate: null,
      phone: null,
      google: EMPTY_GOOGLE_INFO,
      facebook: {
        ...EMPTY_FACEBOOK_INFO,
        userId: user.userId,
        accessToken: user.accessToken,
        email: facebookEmail
      },
      isLoggedInWithGoogle: false,
      isLoggedInWithFacebook: true,
      role: Role.MANAGER
    });

    await this.eventBusService.emitAsync<IFacebookAuthEvent>(
      EventType.AUTH_REGISTER_FACEBOOK,
      {
        userId: createdUser._id,
        facebookAccessToken: user.accessToken
      },
      AuthService.name
    );

    return this.generateAccessToken(createdUser);
  }

  async register(credentials: CreateUserDto): Promise<IUserResponse> {
    const existingUser = await this.usersService.findUser({
      email: credentials.email
    });

    if (existingUser) {
      throw new BadRequestException(ServerErrorCode.USER_ALREADY_EXISTS);
    }

    const encryptedPassword = await encryptPassword(credentials.password);
    return await this.usersService.createUser({
      ...credentials,
      password: encryptedPassword
    });
  }

  async updateEmail(userId: string, email: string) {
    const foundUser = await this.usersService.findUser({ _id: userId });

    if (!foundUser) {
      throw new BadRequestException(ServerErrorCode.USER_NOT_FOUND);
    }

    await this.usersService.updateUser(foundUser._id, { email });

    const foundUsers = await this.usersService.findUsers({ email });

    if (foundUsers.length === 1) {
      await this.eventBusService.emitAsync<IUserEmailUpdatedEvent>(EventType.USER_EMAIL_UPDATED, { userId }, AuthService.name);
      return 'User email was successfully updated';
    }

    const userMergeResult = await this.userMergeService.mergeAccountsByEmail(email);

    for (const deletedUserId of userMergeResult.deletedUserIds) {
      const foundAgencies = await this.agenciesService.findAgencies({ userId: deletedUserId.toString() });
      for (const foundAgency of foundAgencies) {
        await this.agenciesService.updateAgency(foundAgency._id, { userId: userMergeResult.mergedUserId.toString() });
      }
    }

    const agencyMergeResult = await this.agencyMergeService.mergeAgenciesByUserId(userMergeResult.mergedUserId.toString());

    if (agencyMergeResult && agencyMergeResult.mergedAgencyId) {
      await this.agenciesService.updateAgency(agencyMergeResult.mergedAgencyId.toString(), { email });
    }

    await this.eventBusService.emitAsync<IUserEmailUpdatedEvent>(EventType.USER_EMAIL_UPDATED, { userId }, AuthService.name);
    return 'User email was successfully updated and accounts were merged';
  }

  private async checkPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcryptJs.compare(password, hashedPassword);
  }

  private generateAccessToken(user: IUserResponse): IAccessToken {
    const payload = { sub: { _id: user._id, email: user.email } };
    return { [LocalStorageKey.ACCESS_TOKEN]: this.jwtService.sign(payload) };
  }
}
