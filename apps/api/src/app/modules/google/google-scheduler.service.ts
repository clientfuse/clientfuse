import { ApiEnv } from '@connectly/models';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isEmpty, isNil } from 'lodash';
import { DateTime } from 'luxon';
import { UsersService } from '../users/users.service';
import { GoogleAccounts } from './google-accounts.class';
import { getGoogleTokenExpirationDate } from './utils/google.utils';

@Injectable()
export class GoogleSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(GoogleSchedulerService.name);
  private readonly googleClientId: string = this.configService.get(ApiEnv.GOOGLE_CLIENT_ID);
  private readonly googleClientSecret: string = this.configService.get(ApiEnv.GOOGLE_CLIENT_SECRET);
  private readonly googleCallbackUrl: string = this.configService.get(ApiEnv.GOOGLE_CALLBACK_URL);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {
  }

  async onModuleInit(): Promise<void> {
    await this.handleTokenRefresh();
  }


  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTokenRefresh(): Promise<void> {
    this.logger.log('Starting Google token refresh job...');

    try {
      const usersWithGoogleTokens = await this.usersService.findUsers({
        googleRefreshToken: <any>{ $ne: null, $exists: true },
        isLoggedInWithGoogle: true
      });

      if (isEmpty(usersWithGoogleTokens)) {
        this.logger.log('No users with Google tokens found');
        return;
      }

      this.logger.log(`Found ${usersWithGoogleTokens.length} users with Google tokens`);

      let refreshedCount = 0;
      let errorCount = 0;

      for (const user of usersWithGoogleTokens) {
        try {
          await this.processUserTokenRefresh(user);
          refreshedCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(`Failed to refresh tokens for user ${user._id}:`, error);
        }
      }

      this.logger.log(
        `Token refresh job completed. Refreshed: ${refreshedCount}, Errors: ${errorCount}`
      );

    } catch (error) {
      this.logger.error('Error in token refresh job:', error);
    }
  }

  private async processUserTokenRefresh(user: any): Promise<void> {
    if (!this.shouldRefreshToken(user.googleTokenExpirationDate)) {
      this.logger.debug(`Token for user ${user._id} is still valid`);
      return;
    }

    this.logger.log(`Refreshing token for user ${user._id}`);

    const googleAccounts = new GoogleAccounts(
      this.googleClientId,
      this.googleClientSecret,
      this.googleCallbackUrl
    );

    googleAccounts.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    try {
      const refreshedTokens = await googleAccounts.refreshTokens();

      await this.usersService.updateUser(
        user._id,
        {
          googleAccessToken: refreshedTokens.access_token,
          googleRefreshToken: refreshedTokens.refresh_token || user.googleRefreshToken,
          googleTokenExpirationDate: getGoogleTokenExpirationDate(refreshedTokens.expiry_date)
        });

      this.logger.log(`Successfully refreshed tokens for user ${user._id}`);
    } catch (error) {
      this.logger.error(`Failed to refresh tokens for user ${user._id}:`, error);
      if (this.isRefreshTokenError(error)) {
        await this.usersService.updateUser(user._id, {
          googleAccessToken: null,
          googleRefreshToken: null,
          googleTokenExpirationDate: null
        });
        this.logger.warn(`Cleared invalid Google tokens for user ${user._id}`);
      }

      throw error;
    }
  }

  private shouldRefreshToken(expirationDate: Date): boolean {
    if (isNil(expirationDate)) {
      return true;
    }

    const tenMinutesFromNow = DateTime.now().plus({ minutes: 10 });
    const tokenExpiry = DateTime.fromJSDate(expirationDate);

    return tokenExpiry.toMillis() <= tenMinutesFromNow.toMillis();
  }

  private isRefreshTokenError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('invalid_grant') ||
      errorMessage.includes('invalid_request') ||
      errorMessage.includes('refresh_token')
    );
  }
}
