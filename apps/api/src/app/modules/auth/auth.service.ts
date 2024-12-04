import { IAccessToken, LocalStorageKey, ServerErrorCode } from '@connectly/models';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptJs from 'bcryptjs';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserDocument } from '../users/schemas/users.schema';
import { UsersService } from '../users/users.service';
import { encryptPassword, getUserWithoutPassword } from '../users/utils/user.utils';
import { LoginDto } from './auth.controller';

@Injectable()
export class AuthService {

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService
  ) {
  }

  login(credentials: LoginDto, isPassHashed: boolean): Observable<IAccessToken> {
    return this.usersService.findOne({email: credentials.email})
      .pipe(
        switchMap((user: UserDocument) => {
          if (!user) {
            throw new UnauthorizedException(ServerErrorCode.USER_NOT_FOUND);
          }

          return this.checkPassword(credentials.password, user.password, isPassHashed)
            .pipe(
              map((isPasswordCorrect: boolean) => {
                if (!isPasswordCorrect) {
                  throw new UnauthorizedException(ServerErrorCode.USER_NOT_FOUND);
                }

                const payload = {
                  sub: getUserWithoutPassword({
                    ...user.toJSON(),
                    _id: user._id.toString()
                  })
                };
                return {[LocalStorageKey.ACCESS_TOKEN]: this.jwtService.sign(payload)};
              })
            );

        })
      );
  }

  register(credentials: CreateUserDto): Observable<IAccessToken> {
    return this.usersService.findOne({email: credentials.email})
      .pipe(
        switchMap(user => {
          if (user) {
            return this.login({email: user.email, password: user.password}, true);
          }

          return encryptPassword(credentials.password)
            .pipe(
              switchMap((encryptedPassword: string) => this.usersService.create({...credentials, password: encryptedPassword})),
              switchMap((user) => this.login({email: user.email, password: credentials.password}, false))
            );
        })
      );
  }

  private checkPassword(
    password: string,
    hashedPassword: string,
    isPassHashed: boolean
  ): Observable<boolean> {
    if (isPassHashed) return of(password === hashedPassword);
    return from(bcryptJs.compare(password, hashedPassword));
  }
}
