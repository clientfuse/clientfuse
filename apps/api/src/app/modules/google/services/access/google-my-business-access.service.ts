import {
  AccessType,
  ApiEnv,
  GOOGLE_MY_BUSINESS_MANAGE_SCOPE,
  GoogleServiceType,
  IBaseAccessRequest,
  IGrantAccessResponse,
  IBaseUserInfo,
  IBaseGetEntityUsersParams,
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
export class GoogleMyBusinessAccessService implements IGoogleBaseAccessService {
  private readonly logger = new Logger(GoogleMyBusinessAccessService.name);
  private oauth2Client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_ID),
      this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_SECRET),
      this.configService.get<string>(ApiEnv.GOOGLE_CALLBACK_URL)
    );
  }

  async grantManagementAccess(accountName: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting My Business management access to ${agencyEmail} for account ${accountName}`);

    const result = await this.grantAgencyAccess({
      entityId: accountName,
      agencyIdentifier: agencyEmail,
      permissions: ['MANAGER']
    });

    return {
      ...result,
      service: GoogleServiceType.MY_BUSINESS,
      accessType: AccessType.MANAGE,
      entityId: accountName,
      agencyIdentifier: agencyEmail
    };
  }

  async grantViewAccess(accountName: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting My Business view access to ${agencyEmail} for account ${accountName}`);

    const result = await this.grantAgencyAccess({
      entityId: accountName,
      agencyIdentifier: agencyEmail,
      permissions: ['SITE_MANAGER']
    });

    return {
      ...result,
      service: GoogleServiceType.MY_BUSINESS,
      accessType: AccessType.VIEW,
      entityId: accountName,
      agencyIdentifier: agencyEmail
    };
  }


  setCredentials(tokens: { access_token?: string; refresh_token?: string }): void {
    if (isEmpty(tokens) || isNil(tokens)) {
      throw new Error('Tokens are required for Google My Business access management');
    }
    this.oauth2Client.setCredentials(tokens);
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<IGrantAccessResponse> {
    try {
      this.logger.log(`Granting Google My Business access to account ${request.entityId} for ${request.agencyIdentifier}`);

      const myBusinessAccountManagement = google.mybusinessaccountmanagement({
        version: 'v1',
        auth: this.oauth2Client
      });

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyIdentifier);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyIdentifier} already has access to account ${request.entityId}`);
        return {
          success: false,
          service: GoogleServiceType.MY_BUSINESS,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: ServerErrorCode.USER_ALREADY_EXISTS,
          linkId: existingAccess.linkId
        };
      }

      const invitation = {
        targetAccount: request.entityId,
        targetType: 'ACCOUNT',
        role: request.permissions[0] || 'MANAGER',
        inviterAccountId: request.entityId
      };

      const response = await myBusinessAccountManagement.accounts.admins.create({
        parent: request.entityId,
        requestBody: invitation
      });

      this.logger.log(`Successfully created My Business invitation for ${request.agencyIdentifier} to account ${request.entityId}`);

      return {
        success: true,
        service: GoogleServiceType.MY_BUSINESS,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        linkId: response.data.name || 'invitation-created',
        message: `My Business invitation sent successfully to ${request.agencyIdentifier}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant Google My Business access: ${error.message}`, error);

      return {
        success: false,
        service: GoogleServiceType.MY_BUSINESS,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        error: `Failed to grant access: ${error.message}`
      };
    }
  }

  async checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null> {
    try {
      const myBusinessAccountManagement = google.mybusinessaccountmanagement({
        version: 'v1',
        auth: this.oauth2Client
      });

      const response = await myBusinessAccountManagement.accounts.admins.list({
        parent: entityId
      });

      if (isNil(response.data.accountAdmins)) {
        return null;
      }

      const existingUser = response.data.accountAdmins.find(
        (admin: any) => admin.admin?.toLowerCase() === email.toLowerCase()
      );

      if (!existingUser) {
        return null;
      }

      return {
        linkId: existingUser.name || 'unknown',
        email: existingUser.admin || email,
        permissions: [existingUser.role || 'MANAGER'],
        kind: 'mybusiness#accountAdmin'
      };

    } catch (error) {
      this.logger.error(`Error checking existing My Business user access: ${error.message}`, error);
      return null;
    }
  }

  async getEntityUsers(params: IBaseGetEntityUsersParams): Promise<IBaseUserInfo[]> {
    const { entityId } = params;
    try {
      const myBusinessAccountManagement = google.mybusinessaccountmanagement({
        version: 'v1',
        auth: this.oauth2Client
      });

      const response = await myBusinessAccountManagement.accounts.admins.list({
        parent: entityId
      });

      if (isNil(response.data.accountAdmins)) {
        return [];
      }

      return response.data.accountAdmins.map((admin: any) => ({
        linkId: admin.name || 'unknown',
        email: admin.admin || '',
        permissions: [admin.role || 'MANAGER'],
        kind: 'mybusiness#accountAdmin'
      }));

    } catch (error) {
      this.logger.error(`Error fetching My Business entity users: ${error.message}`, error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse> {
    try {
      const myBusinessAccountManagement = google.mybusinessaccountmanagement({
        version: 'v1',
        auth: this.oauth2Client
      });

      await myBusinessAccountManagement.accounts.admins.delete({
        name: linkId
      });

      this.logger.log(`Successfully revoked My Business access for ${linkId} from account ${entityId}`);

      return {
        success: true,
        service: GoogleServiceType.MY_BUSINESS,
        message: 'My Business access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke My Business access: ${error.message}`, error);

      return {
        success: false,
        service: GoogleServiceType.MY_BUSINESS,
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
    return [GOOGLE_MY_BUSINESS_MANAGE_SCOPE];
  }

  private determineAccessType(permissions: string[]): AccessType {
    const firstPermission = permissions[0];
    return firstPermission === 'MANAGER' || firstPermission === 'OWNER' || firstPermission === 'PRIMARY_OWNER' ? AccessType.MANAGE : AccessType.VIEW;
  }
}
