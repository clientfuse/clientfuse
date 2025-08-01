import { ApiEnv, GOOGLE_ANALYTICS_MANAGE_USERS_SCOPE, ServerErrorCode } from '@connectly/models';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { google } from 'googleapis';
import { isEmpty, isNil } from 'lodash';
import {
  GoogleAnalyticsPermission,
  IBaseAccessRequest,
  IBaseAccessResponse,
  IGoogleBaseAccessService,
  IBaseUserInfo,
  ICustomAccessOptions
} from '../../models/google.model';

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

  async getEntityUsers(entityId: string): Promise<IBaseUserInfo[]> {
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

  getDefaultAgencyPermissions(): GoogleAnalyticsPermission[] {
    return ['READ_AND_ANALYZE', 'COLLABORATE'];
  }

  getAllAvailablePermissions(): GoogleAnalyticsPermission[] {
    return ['READ_AND_ANALYZE', 'COLLABORATE', 'EDIT', 'MANAGE_USERS'];
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

  async grantReadOnlyAccess(accountId: string, agencyEmail: string): Promise<IBaseAccessResponse> {
    this.logger.log(`Granting read-only access to ${agencyEmail} for Analytics account ${accountId}`);

    return this.grantAgencyAccess({
      entityId: accountId,
      agencyEmail: agencyEmail,
      permissions: ['READ_AND_ANALYZE']
    });
  }

  async grantCustomAccess(options: ICustomAccessOptions): Promise<IBaseAccessResponse> {
    try {
      this.logger.log(`Granting custom access to ${options.agencyEmail} for Analytics account ${options.entityId}`);
      this.logger.log(`Custom options: ${JSON.stringify({
        permissions: options.permissions,
        propertyId: options.propertyId,
        viewId: options.viewId,
        notifyUser: options.notifyUser
      })}`);

      const customOptions = options;

      if (customOptions.viewId && customOptions.propertyId) {
        return this.grantViewAccess(
          options.entityId,
          customOptions.propertyId,
          customOptions.viewId,
          options.agencyEmail,
          options.permissions as GoogleAnalyticsPermission[]
        );
      }

      if (customOptions.propertyId) {
        return this.grantPropertyAccess(
          options.entityId,
          customOptions.propertyId,
          options.agencyEmail,
          options.permissions as GoogleAnalyticsPermission[]
        );
      }

      const result = await this.grantAgencyAccess({
        entityId: options.entityId,
        agencyEmail: options.agencyEmail,
        permissions: options.permissions
      });

      if (options.customMessage && result.success) {
        result.message = `${result.message} - ${options.customMessage}`;
      }

      return result;

    } catch (error) {
      this.logger.error(`Failed to grant custom access: ${error.message}`, error);

      return {
        success: false,
        error: `Failed to grant custom access: ${error.message}`
      };
    }
  }

  async getAccountProperties(accountId: string): Promise<any[]> {
    try {
      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      const response = await analytics.management.webproperties.list({
        accountId: accountId
      });

      return response.data.items || [];

    } catch (error) {
      this.logger.error(`Error fetching Analytics properties: ${error.message}`, error);
      return [];
    }
  }

  async getPropertyViews(accountId: string, propertyId: string): Promise<any[]> {
    try {
      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      const response = await analytics.management.profiles.list({
        accountId: accountId,
        webPropertyId: propertyId
      });

      return response.data.items || [];

    } catch (error) {
      this.logger.error(`Error fetching Analytics views: ${error.message}`, error);
      return [];
    }
  }

  async grantPropertyAccess(
    accountId: string,
    propertyId: string,
    agencyEmail: string,
    permissions: GoogleAnalyticsPermission[]
  ): Promise<IBaseAccessResponse> {
    try {
      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      const userLink = {
        userRef: {
          email: agencyEmail
        },
        permissions: {
          local: permissions
        }
      };

      const response = await analytics.management.webpropertyUserLinks.insert({
        accountId: accountId,
        webPropertyId: propertyId,
        requestBody: userLink
      });

      this.logger.log(`Successfully granted property access to ${agencyEmail} for property ${propertyId}`);

      return {
        success: true,
        linkId: response.data.id,
        message: `Property access granted successfully to ${agencyEmail}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant property access: ${error.message}`, error);

      return {
        success: false,
        error: `Failed to grant property access: ${error.message}`
      };
    }
  }

  async grantViewAccess(
    accountId: string,
    propertyId: string,
    viewId: string,
    agencyEmail: string,
    permissions: GoogleAnalyticsPermission[]
  ): Promise<IBaseAccessResponse> {
    try {
      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      const userLink = {
        userRef: {
          email: agencyEmail
        },
        permissions: {
          local: permissions
        }
      };

      const response = await analytics.management.profileUserLinks.insert({
        accountId: accountId,
        webPropertyId: propertyId,
        profileId: viewId,
        requestBody: userLink
      });

      this.logger.log(`Successfully granted view access to ${agencyEmail} for view ${viewId}`);

      return {
        success: true,
        linkId: response.data.id,
        message: `View access granted successfully to ${agencyEmail}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant view access: ${error.message}`, error);

      return {
        success: false,
        error: `Failed to grant view access: ${error.message}`
      };
    }
  }
}
