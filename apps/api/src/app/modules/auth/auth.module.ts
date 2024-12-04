import { ApiEnv } from '@connectly/models';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, FacebookStrategy, JwtStrategy],
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env[ApiEnv.JWT_SECRET],
      signOptions: {expiresIn: '30d'}
    }),
    PassportModule
    // MailModule todo add mail module
  ]
})
export class AuthModule {
}
