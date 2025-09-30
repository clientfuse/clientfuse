import {
  ApiEnv,
  GOOGLE_TAGMANAGER_MANAGE_USERS_SCOPE,
  GoogleServiceType,
  IBaseAccessRequest,
  IGrantAccessResponse,
  IBaseUserInfo,
  IGoogleBaseAccessService,
  IBaseGetEntityUsersParams,
  IRevokeAccessResponse,
  ServerErrorCode,
  TAccessType
} from '@clientfuse/models';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { google } from 'googleapis';
import { isEmpty, isNil } from 'lodash';


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

  async grantManagementAccess(accountId: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting GTM management access to ${agencyEmail} for account ${accountId}`);

    const result = await this.grantAgencyAccess({
      entityId: accountId,
      agencyIdentifier: agencyEmail,
      permissions: ['admin']
    });

    return {
      ...result,
      service: GoogleServiceType.TAG_MANAGER,
      accessType: 'manage' as TAccessType,
      entityId: accountId,
      agencyIdentifier: agencyEmail
    };
  }

  async grantViewAccess(accountId: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting GTM view access to ${agencyEmail} for account ${accountId}`);

    const result = await this.grantAgencyAccess({
      entityId: accountId,
      agencyIdentifier: agencyEmail,
      permissions: ['user']
    });

    return {
      ...result,
      service: GoogleServiceType.TAG_MANAGER,
      accessType: 'view' as TAccessType,
      entityId: accountId,
      agencyIdentifier: agencyEmail
    };
  }


  async grantAgencyAccess(request: IBaseAccessRequest): Promise<IGrantAccessResponse> {
    try {
      this.logger.log(`Granting Google Tag Manager access to account ${request.entityId} for ${request.agencyIdentifier}`);

      const tagManager = google.tagmanager({ version: 'v2', auth: this.oauth2Client });

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyIdentifier);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyIdentifier} already has access to account ${request.entityId}`);
        return {
          success: false,
          service: GoogleServiceType.TAG_MANAGER,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: ServerErrorCode.USER_ALREADY_EXISTS,
          linkId: existingAccess.linkId
        };
      }

      const accountPermission = this.mapPermissionToAccountPermission(request.permissions[0]);

      const userPermission = {
        emailAddress: request.agencyIdentifier.toLowerCase().trim(),
        accountAccess: {
          permission: accountPermission
        }
      };

      const response = await tagManager.accounts.user_permissions.create({
        parent: `accounts/${request.entityId}`,
        requestBody: userPermission
      });

      this.logger.log(`Successfully granted GTM access to ${request.agencyIdentifier} for account ${request.entityId}`);

      return {
        success: true,
        service: GoogleServiceType.TAG_MANAGER,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        linkId: response.data.path || `accounts/${request.entityId}/user_permissions/${request.agencyIdentifier}`,
        message: `GTM access granted successfully to ${request.agencyIdentifier}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant Google Tag Manager access: ${error.message}`, error);

      if (error.response?.status === 403) {
        return {
          success: false,
          service: GoogleServiceType.TAG_MANAGER,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Insufficient permissions to manage GTM users'
        };
      } else if (error.response?.status === 404) {
        return {
          success: false,
          service: GoogleServiceType.TAG_MANAGER,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'GTM account not found'
        };
      }

      return {
        success: false,
        service: GoogleServiceType.TAG_MANAGER,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
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

  async getEntityUsers(params: IBaseGetEntityUsersParams): Promise<IBaseUserInfo[]> {
    const { entityId } = params;
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

  async revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse> {
    try {
      const tagManager = google.tagmanager({ version: 'v2', auth: this.oauth2Client });

      await tagManager.accounts.user_permissions.delete({
        path: linkId
      });

      this.logger.log(`Successfully revoked GTM access for ${linkId} from account ${entityId}`);

      return {
        success: true,
        service: GoogleServiceType.TAG_MANAGER,
        message: 'GTM access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke GTM access: ${error.message}`, error);
      return {
        success: false,
        service: GoogleServiceType.TAG_MANAGER,
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
    return [GOOGLE_TAGMANAGER_MANAGE_USERS_SCOPE];
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

  private determineAccessType(permissions: string[]): TAccessType {
    const firstPermission = permissions[0];
    return firstPermission === 'admin' || firstPermission === 'manage' || firstPermission === 'publish' ? 'manage' : 'view';
  }
}
