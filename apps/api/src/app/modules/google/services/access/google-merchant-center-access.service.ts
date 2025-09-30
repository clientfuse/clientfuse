import {
  ApiEnv,
  GOOGLE_MERCHANT_CENTER_SCOPE,
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
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { google } from 'googleapis';
import { isEmpty, isNil } from 'lodash';

@Injectable()
export class GoogleMerchantCenterAccessService implements IGoogleBaseAccessService {
  private readonly logger = new Logger(GoogleMerchantCenterAccessService.name);
  private oauth2Client: OAuth2Client = new google.auth.OAuth2(
    this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_ID),
    this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_SECRET),
    this.configService.get<string>(ApiEnv.GOOGLE_CALLBACK_URL)
  );

  constructor(
    private readonly configService: ConfigService
  ) {
  }

  async grantManagementAccess(merchantId: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting Merchant Center management access to ${agencyEmail} for merchant ${merchantId}`);

    const result = await this.grantAgencyAccess({
      entityId: merchantId,
      agencyIdentifier: agencyEmail,
      permissions: ['ADMIN']
    });

    return {
      ...result,
      service: GoogleServiceType.MERCHANT_CENTER,
      accessType: 'manage' as TAccessType,
      entityId: merchantId,
      agencyIdentifier: agencyEmail
    };
  }

  async grantViewAccess(merchantId: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting Merchant Center view access to ${agencyEmail} for merchant ${merchantId}`);

    const result = await this.grantAgencyAccess({
      entityId: merchantId,
      agencyIdentifier: agencyEmail,
      permissions: ['STANDARD']
    });

    return {
      ...result,
      service: GoogleServiceType.MERCHANT_CENTER,
      accessType: 'view' as TAccessType,
      entityId: merchantId,
      agencyIdentifier: agencyEmail
    };
  }


  setCredentials(tokens: { access_token?: string; refresh_token?: string }): void {
    if (isEmpty(tokens) || isNil(tokens)) {
      throw new Error('Tokens are required for Google Merchant Center access management');
    }

    this.oauth2Client.setCredentials(tokens);
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<IGrantAccessResponse> {
    try {
      this.logger.log(`Granting Google Merchant Center access to account ${request.entityId} for ${request.agencyIdentifier}`);

      const merchantapi = google.merchantapi({ version: 'accounts_v1beta', auth: this.oauth2Client });

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyIdentifier);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyIdentifier} already has access to merchant ${request.entityId}`);
        return {
          success: false,
          service: GoogleServiceType.MERCHANT_CENTER,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: ServerErrorCode.USER_ALREADY_EXISTS,
          linkId: existingAccess.linkId
        };
      }

      const accessRights = this.mapPermissionsToAccessRights(request.permissions);

      const userRequest = {
        parent: `accounts/${request.entityId}`,
        userId: request.agencyIdentifier,
        requestBody: {
          accessRights: accessRights,
          name: `accounts/${request.entityId}/users/${request.agencyIdentifier}`
        }
      };

      const response = await merchantapi.accounts.users.create(userRequest);

      this.logger.log(`Successfully granted Merchant Center access to ${request.agencyIdentifier} for account ${request.entityId}`);

      return {
        success: true,
        service: GoogleServiceType.MERCHANT_CENTER,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        linkId: response.data.name || `accounts/${request.entityId}/users/${request.agencyIdentifier}`,
        message: `Merchant Center access granted successfully to ${request.agencyIdentifier}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant Google Merchant Center access: ${error.message}`, error);

      return {
        success: false,
        service: GoogleServiceType.MERCHANT_CENTER,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        error: `Failed to grant access: ${error.message}`
      };
    }
  }

  async checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null> {
    try {
      const merchantapi = google.merchantapi({ version: 'accounts_v1beta', auth: this.oauth2Client });

      const response = await merchantapi.accounts.users.list({
        parent: `accounts/${entityId}`
      });

      if (isNil(response.data.users)) {
        return null;
      }

      const existingUser = response.data.users.find(
        (user: any) => user.name?.includes(email.toLowerCase())
      );

      if (!existingUser) {
        return null;
      }

      return {
        linkId: existingUser.name || 'unknown',
        email: email,
        permissions: existingUser.accessRights || ['STANDARD'],
        kind: 'merchantapi#user'
      };

    } catch (error) {
      this.logger.error(`Error checking existing Merchant Center user access: ${error.message}`, error);
      return null;
    }
  }

  async getEntityUsers(params: IBaseGetEntityUsersParams): Promise<IBaseUserInfo[]> {
    const { entityId } = params;
    try {
      const merchantapi = google.merchantapi({ version: 'accounts_v1beta', auth: this.oauth2Client });

      const response = await merchantapi.accounts.users.list({
        parent: `accounts/${entityId}`
      });

      if (isNil(response.data.users)) {
        return [];
      }

      return response.data.users.map((user: any) => ({
        linkId: user.name || 'unknown',
        email: this.extractEmailFromUserName(user.name) || '',
        permissions: user.accessRights || ['STANDARD'],
        kind: 'merchantapi#user'
      }));

    } catch (error) {
      this.logger.error(`Error fetching Merchant Center entity users: ${error.message}`, error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse> {
    try {
      const merchantapi = google.merchantapi({ version: 'accounts_v1beta', auth: this.oauth2Client });

      await merchantapi.accounts.users.delete({
        name: linkId
      });

      this.logger.log(`Successfully revoked Merchant Center access for ${linkId} from account ${entityId}`);

      return {
        success: true,
        service: GoogleServiceType.MERCHANT_CENTER,
        message: 'Merchant Center access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke Merchant Center access: ${error.message}`, error);

      return {
        success: false,
        service: GoogleServiceType.MERCHANT_CENTER,
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
    return [GOOGLE_MERCHANT_CENTER_SCOPE];
  }

  private mapPermissionsToAccessRights(permissions: string[]): string[] {
    const permissionMap: Record<string, string> = {
      'ADMIN': 'ADMIN',
      'STANDARD': 'STANDARD'
    };

    return permissions.map(permission => permissionMap[permission] || 'STANDARD');
  }

  private extractEmailFromUserName(userName: string): string | null {
    if (!userName) return null;

    // *** Extract email from user name format: accounts/{merchantId}/users/{email} ***
    const parts = userName.split('/');
    return parts.length >= 4 ? parts[3] : null;
  }

  private determineAccessType(permissions: string[]): TAccessType {
    const firstPermission = permissions[0];
    return firstPermission === 'ADMIN' ? 'manage' : 'view';
  }
}
