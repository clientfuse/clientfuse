import {
  ApiEnv,
  GOOGLE_ANALYTICS_MANAGE_USERS_SCOPE,
  IBaseAccessRequest,
  IBaseAccessResponse,
  IBaseGetEntityUsersParams,
  IBaseUserInfo,
  IGoogleBaseAccessService,
  ServerErrorCode
} from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { google } from 'googleapis';
import { isEmpty, isNil } from 'lodash';

@Injectable()
export class GoogleAnalyticsAccessService implements IGoogleBaseAccessService {
  private readonly logger = new Logger(GoogleAnalyticsAccessService.name);
  private oauth2Client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_ID),
      this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_SECRET),
      this.configService.get<string>(ApiEnv.GOOGLE_CALLBACK_URL)
    );
  }

  setCredentials(tokens: { access_token?: string; refresh_token?: string }): void {
    if (isEmpty(tokens) || isNil(tokens)) {
      throw new Error('Tokens are required for Google Analytics access management');
    }
    this.oauth2Client.setCredentials(tokens);
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<IBaseAccessResponse> {
    try {
      this.logger.log(`Granting Google Analytics access to account ${request.entityId} for ${request.agencyEmail}`);

      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyEmail);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyEmail} already has access to account ${request.entityId}`);
        return {
          success: false,
          error: ServerErrorCode.USER_ALREADY_EXISTS,
          linkId: existingAccess.linkId
        };
      }

      const userLink = {
        userRef: {
          email: request.agencyEmail
        },
        permissions: {
          local: request.permissions
        }
      };

      const response = await analytics.management.accountUserLinks.insert({
        accountId: request.entityId,
        requestBody: userLink
      });

      this.logger.log(`Successfully granted Analytics access to ${request.agencyEmail} for account ${request.entityId}`);

      return {
        success: true,
        linkId: response.data.id,
        entityId: request.entityId,
        message: `Google Analytics access granted successfully to ${request.agencyEmail}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant Google Analytics access: ${error.message}`, error);

      return {
        success: false,
        error: `Failed to grant access: ${error.message}`
      };
    }
  }

  async checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null> {
    try {
      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      const response = await analytics.management.accountUserLinks.list({
        accountId: entityId
      });

      if (isNil(response.data.items)) {
        return null;
      }

      const existingUser = response.data.items.find(
        (item: any) => item.userRef?.email?.toLowerCase() === email.toLowerCase()
      );

      if (!existingUser) {
        return null;
      }

      return {
        linkId: existingUser.id || 'unknown',
        email: existingUser.userRef?.email || email,
        permissions: existingUser.permissions?.local || ['READ_AND_ANALYZE'],
        kind: 'analytics#accountUserLink'
      };

    } catch (error) {
      this.logger.error(`Error checking existing Analytics user access: ${error.message}`, error);
      return null;
    }
  }

  async getEntityUsers(params: IBaseGetEntityUsersParams): Promise<IBaseUserInfo[]> {
    const { entityId } = params;
    try {
      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      const response = await analytics.management.accountUserLinks.list({
        accountId: entityId
      });

      if (isNil(response.data.items)) {
        return [];
      }

      return response.data.items.map((item: any) => ({
        linkId: item.id || 'unknown',
        email: item.userRef?.email || '',
        permissions: item.permissions?.local || ['READ_AND_ANALYZE'],
        kind: 'analytics#accountUserLink'
      }));

    } catch (error) {
      this.logger.error(`Error fetching Analytics entity users: ${error.message}`, error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IBaseAccessResponse> {
    try {
      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      await analytics.management.accountUserLinks.delete({
        accountId: entityId,
        linkId: linkId
      });

      this.logger.log(`Successfully revoked Analytics access for link ${linkId} from account ${entityId}`);

      return {
        success: true,
        message: 'Google Analytics access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke Analytics access: ${error.message}`, error);

      return {
        success: false,
        error: `Failed to revoke access: ${error.message}`
      };
    }
  }

  validateRequiredScopes(grantedScopes: string[]): boolean {
    const requiredScopes = this.getRequiredScopes();
    return requiredScopes.every(scope =>
      grantedScopes.some(granted => granted.includes(scope))
    );
  }

  getRequiredScopes(): string[] {
    return [GOOGLE_ANALYTICS_MANAGE_USERS_SCOPE];
  }

  async grantManagementAccess(accountId: string, agencyEmail: string): Promise<IBaseAccessResponse> {
    this.logger.log(`Granting management access to ${agencyEmail} for Analytics account ${accountId}`);

    return this.grantAgencyAccess({
      entityId: accountId,
      agencyEmail: agencyEmail,
      permissions: ['MANAGE_USERS', 'EDIT']
    });
  }

  async grantViewAccess(accountId: string, agencyEmail: string): Promise<IBaseAccessResponse> {
    this.logger.log(`Granting view access to ${agencyEmail} for Analytics account ${accountId}`);

    return this.grantAgencyAccess({
      entityId: accountId,
      agencyEmail: agencyEmail,
      permissions: ['READ_AND_ANALYZE']
    });
  }
}
