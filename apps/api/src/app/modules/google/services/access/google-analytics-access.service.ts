import {
  AccessType,
  ApiEnv,
  GOOGLE_ANALYTICS_MANAGE_USERS_SCOPE,
  GoogleServiceType,
  IBaseAccessRequest,
  IGrantAccessResponse,
  IBaseGetEntityUsersParams,
  IBaseUserInfo,
  IGoogleBaseAccessService,
  IRevokeAccessResponse,
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

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<IGrantAccessResponse> {
    try {
      this.logger.log(`Granting Google Analytics access to account ${request.entityId} for ${request.agencyIdentifier}`);

      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyIdentifier);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyIdentifier} already has access to account ${request.entityId}`);
        return {
          success: false,
          service: GoogleServiceType.ANALYTICS,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: ServerErrorCode.USER_ALREADY_EXISTS,
          linkId: existingAccess.linkId
        };
      }

      const userLink = {
        userRef: {
          email: request.agencyIdentifier
        },
        permissions: {
          local: request.permissions
        }
      };

      const response = await analytics.management.accountUserLinks.insert({
        accountId: request.entityId,
        requestBody: userLink
      });

      this.logger.log(`Successfully granted Analytics access to ${request.agencyIdentifier} for account ${request.entityId}`);

      return {
        success: true,
        service: 'analytics' as GoogleServiceType,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        linkId: response.data.id,
        message: `Google Analytics access granted successfully to ${request.agencyIdentifier}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant Google Analytics access: ${error.message}`, error);

      return {
        success: false,
        service: 'analytics' as GoogleServiceType,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
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

  async revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse> {
    try {
      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      await analytics.management.accountUserLinks.delete({
        accountId: entityId,
        linkId: linkId
      });

      this.logger.log(`Successfully revoked Analytics access for link ${linkId} from account ${entityId}`);

      return {
        success: true,
        service: GoogleServiceType.ANALYTICS,
        message: 'Google Analytics access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke Analytics access: ${error.message}`, error);

      return {
        success: false,
        service: GoogleServiceType.ANALYTICS,
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

  async grantManagementAccess(accountId: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting management access to ${agencyEmail} for Analytics account ${accountId}`);

    const result = await this.grantAgencyAccess({
      entityId: accountId,
      agencyIdentifier: agencyEmail,
      permissions: ['MANAGE_USERS', 'EDIT']
    });

    return {
      ...result,
      service: 'analytics' as GoogleServiceType,
      accessType: AccessType.MANAGE,
      entityId: accountId,
      agencyIdentifier: agencyEmail
    };
  }

  async grantViewAccess(accountId: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting view access to ${agencyEmail} for Analytics account ${accountId}`);

    const result = await this.grantAgencyAccess({
      entityId: accountId,
      agencyIdentifier: agencyEmail,
      permissions: ['READ_AND_ANALYZE']
    });

    return {
      ...result,
      service: 'analytics' as GoogleServiceType,
      accessType: AccessType.VIEW,
      entityId: accountId,
      agencyIdentifier: agencyEmail
    };
  }

  private determineAccessType(permissions: string[]): AccessType {
    const hasManagePermissions = permissions.some(p =>
      p === 'MANAGE_USERS' || p === 'EDIT' || p === 'COLLABORATE'
    );
    return hasManagePermissions ? AccessType.MANAGE : AccessType.VIEW;
  }
}
