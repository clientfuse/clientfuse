import {
  ApiEnv,
  GOOGLE_TAGMANAGER_MANAGE_USERS_SCOPE,
  GoogleTagManagerPermission,
  IBaseAccessRequest,
  IBaseAccessResponse,
  IBaseUserInfo,
  ICustomAccessOptions,
  IGoogleBaseAccessService,
  ServerErrorCode
} from '@clientfuse/models';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { google } from 'googleapis';
import { isEmpty, isNil } from 'lodash';

export interface IGoogleTagManagerCustomOptions extends ICustomAccessOptions {
  accountId: string;
  containerId?: string;
  containerPermissions?: {
    containerId: string;
    permission: GoogleTagManagerPermission;
  }[];
}

@Injectable()
export class GoogleTagManagerAccessService implements IGoogleBaseAccessService {
  private readonly logger = new Logger(GoogleTagManagerAccessService.name);
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
      throw new BadRequestException('Tokens are required for Google Tag Manager access management');
    }
    this.oauth2Client.setCredentials(tokens);
  }

  async grantManagementAccess(accountId: string, agencyEmail: string): Promise<IBaseAccessResponse> {
    this.logger.log(`Granting GTM management access to ${agencyEmail} for account ${accountId}`);

    return this.grantAgencyAccess({
      entityId: accountId,
      agencyEmail: agencyEmail,
      permissions: ['admin']
    });
  }

  async grantReadOnlyAccess(accountId: string, agencyEmail: string): Promise<IBaseAccessResponse> {
    this.logger.log(`Granting GTM read-only access to ${agencyEmail} for account ${accountId}`);

    return this.grantAgencyAccess({
      entityId: accountId,
      agencyEmail: agencyEmail,
      permissions: ['user']
    });
  }

  async grantCustomAccess(options: ICustomAccessOptions): Promise<IBaseAccessResponse> {
    try {
      this.logger.log(`Granting GTM custom access to ${options.agencyEmail} for account ${options.entityId}`);

      const customOptions = options as IGoogleTagManagerCustomOptions;

      if (customOptions.containerPermissions && customOptions.containerPermissions.length > 0) {
        return this.grantContainerSpecificAccess(
          options.entityId,
          options.agencyEmail,
          customOptions.containerPermissions
        );
      }

      if (customOptions.containerId) {
        return this.grantContainerAccess(
          options.entityId,
          customOptions.containerId,
          options.agencyEmail,
          options.permissions[0] as GoogleTagManagerPermission
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
      this.logger.error(`Failed to grant GTM custom access: ${error.message}`, error);
      return {
        success: false,
        error: `Failed to grant custom access: ${error.message}`
      };
    }
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<IBaseAccessResponse> {
    try {
      this.logger.log(`Granting Google Tag Manager access to account ${request.entityId} for ${request.agencyEmail}`);

      const tagManager = google.tagmanager({ version: 'v2', auth: this.oauth2Client });

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyEmail);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyEmail} already has access to account ${request.entityId}`);
        return {
          success: false,
          error: ServerErrorCode.USER_ALREADY_EXISTS,
          linkId: existingAccess.linkId
        };
      }

      const accountPermission = this.mapPermissionToAccountPermission(request.permissions[0]);

      const userPermission = {
        emailAddress: request.agencyEmail.toLowerCase().trim(),
        accountAccess: {
          permission: accountPermission
        }
      };

      const response = await tagManager.accounts.user_permissions.create({
        parent: `accounts/${request.entityId}`,
        requestBody: userPermission
      });

      this.logger.log(`Successfully granted GTM access to ${request.agencyEmail} for account ${request.entityId}`);

      return {
        success: true,
        linkId: response.data.path || `accounts/${request.entityId}/user_permissions/${request.agencyEmail}`,
        entityId: request.entityId,
        message: `GTM access granted successfully to ${request.agencyEmail}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant Google Tag Manager access: ${error.message}`, error);

      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Insufficient permissions to manage GTM users'
        };
      } else if (error.response?.status === 404) {
        return {
          success: false,
          error: 'GTM account not found'
        };
      }

      return {
        success: false,
        error: `Failed to grant access: ${error.message}`
      };
    }
  }

  async checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null> {
    try {
      const tagManager = google.tagmanager({ version: 'v2', auth: this.oauth2Client });
      const normalizedEmail = email.toLowerCase().trim();

      const response = await tagManager.accounts.user_permissions.list({
        parent: `accounts/${entityId}`
      });

      if (isNil(response.data.userPermission)) {
        return null;
      }

      const existingUser = response.data.userPermission.find(
        (permission: any) => permission.emailAddress?.toLowerCase() === normalizedEmail
      );

      if (!existingUser) {
        return null;
      }

      return {
        linkId: existingUser.path || `accounts/${entityId}/user_permissions/${existingUser.emailAddress}`,
        email: existingUser.emailAddress || email,
        permissions: [existingUser.accountAccess?.permission || 'user'],
        kind: 'tagmanager#userPermission'
      };

    } catch (error) {
      this.logger.error(`Error checking existing GTM user access: ${error.message}`, error);
      return null;
    }
  }

  async getEntityUsers(entityId: string): Promise<IBaseUserInfo[]> {
    try {
      const tagManager = google.tagmanager({ version: 'v2', auth: this.oauth2Client });

      const response = await tagManager.accounts.user_permissions.list({
        parent: `accounts/${entityId}`
      });

      if (isNil(response.data.userPermission)) {
        return [];
      }

      return response.data.userPermission.map((permission: any) => ({
        linkId: permission.path || `accounts/${entityId}/user_permissions/${permission.emailAddress}`,
        email: permission.emailAddress || '',
        permissions: [permission.accountAccess?.permission || 'user'],
        kind: 'tagmanager#userPermission'
      }));

    } catch (error) {
      this.logger.error(`Error fetching GTM entity users: ${error.message}`, error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IBaseAccessResponse> {
    try {
      const tagManager = google.tagmanager({ version: 'v2', auth: this.oauth2Client });

      await tagManager.accounts.user_permissions.delete({
        path: linkId
      });

      this.logger.log(`Successfully revoked GTM access for ${linkId} from account ${entityId}`);

      return {
        success: true,
        message: 'GTM access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke GTM access: ${error.message}`, error);
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

  getDefaultAgencyPermissions(): string[] {
    return ['user'];
  }

  getAllAvailablePermissions(): string[] {
    return ['user', 'admin'];
  }

  getRequiredScopes(): string[] {
    return [GOOGLE_TAGMANAGER_MANAGE_USERS_SCOPE];
  }

  getPermissionDescriptions(): Record<string, string> {
    return {
      'user': 'View account information and container details',
      'admin': 'Full administrative access including user management'
    };
  }

  async grantContainerAccess(
    accountId: string,
    containerId: string,
    agencyEmail: string,
    permission: GoogleTagManagerPermission
  ): Promise<IBaseAccessResponse> {
    try {
      this.logger.log(`Granting GTM container access to ${agencyEmail} for container ${containerId}`);

      const containerPermission = this.mapPermissionToContainerPermission(permission);

      const userPermission = {
        emailAddress: agencyEmail.toLowerCase().trim(),
        accountAccess: {
          permission: 'user'
        },
        containerAccess: [
          {
            containerId: containerId,
            permission: containerPermission
          }
        ]
      };

      const tagManager = google.tagmanager({ version: 'v2', auth: this.oauth2Client });

      const response = await tagManager.accounts.user_permissions.create({
        parent: `accounts/${accountId}`,
        requestBody: userPermission
      });

      this.logger.log(`Successfully granted GTM container access to ${agencyEmail}`);

      return {
        success: true,
        linkId: response.data.path || `accounts/${accountId}/user_permissions/${agencyEmail}`,
        message: `GTM container access granted successfully to ${agencyEmail}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant GTM container access: ${error.message}`, error);
      return {
        success: false,
        error: `Failed to grant container access: ${error.message}`
      };
    }
  }

  async grantContainerSpecificAccess(
    accountId: string,
    agencyEmail: string,
    containerPermissions: { containerId: string; permission: GoogleTagManagerPermission }[]
  ): Promise<IBaseAccessResponse> {
    try {
      this.logger.log(`Granting GTM access to ${containerPermissions.length} containers for ${agencyEmail}`);

      const mappedContainerAccess = containerPermissions.map(cp => ({
        containerId: cp.containerId,
        permission: this.mapPermissionToContainerPermission(cp.permission)
      }));

      const userPermission = {
        emailAddress: agencyEmail.toLowerCase().trim(),
        accountAccess: {
          permission: 'user'
        },
        containerAccess: mappedContainerAccess
      };

      const tagManager = google.tagmanager({ version: 'v2', auth: this.oauth2Client });

      const response = await tagManager.accounts.user_permissions.create({
        parent: `accounts/${accountId}`,
        requestBody: userPermission
      });

      this.logger.log(`Successfully granted multi-container GTM access to ${agencyEmail}`);

      return {
        success: true,
        linkId: response.data.path || `accounts/${accountId}/user_permissions/${agencyEmail}`,
        message: `GTM multi-container access granted successfully to ${agencyEmail}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant GTM multi-container access: ${error.message}`, error);
      return {
        success: false,
        error: `Failed to grant multi-container access: ${error.message}`
      };
    }
  }

  private mapPermissionToAccountPermission(permission: string): string {
    const permissionMap: Record<string, string> = {
      'read': 'user',
      'user': 'user',
      'admin': 'admin',
      'manage': 'admin',
      'publish': 'admin'
    };

    return permissionMap[permission] || 'user';
  }

  private mapPermissionToContainerPermission(permission: GoogleTagManagerPermission): string {
    const permissionMap: Record<string, string> = {
      'read': 'read',
      'edit': 'edit',
      'delete': 'edit',
      'publish': 'publish'
    };

    return permissionMap[permission] || 'read';
  }
}
