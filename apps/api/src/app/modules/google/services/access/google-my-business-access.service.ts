import { ApiEnv, GOOGLE_MY_BUSINESS_MANAGE_SCOPE, ServerErrorCode } from '@connectly/models';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { google } from 'googleapis';
import { isEmpty, isNil } from 'lodash';
import {
  GoogleMyBusinessPermission,
  IBaseAccessRequest,
  IBaseAccessResponse,
  IGoogleBaseAccessService,
  IBaseUserInfo,
  ICustomAccessOptions
} from '../../models/google.model';

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

  async grantManagementAccess(accountName: string, agencyEmail: string): Promise<IBaseAccessResponse> {
    this.logger.log(`Granting My Business management access to ${agencyEmail} for account ${accountName}`);

    return this.grantAgencyAccess({
      entityId: accountName,
      agencyEmail: agencyEmail,
      permissions: ['MANAGER']
    });
  }

  async grantReadOnlyAccess(accountName: string, agencyEmail: string): Promise<IBaseAccessResponse> {
    this.logger.log(`Granting My Business read-only access to ${agencyEmail} for account ${accountName}`);

    return this.grantAgencyAccess({
      entityId: accountName,
      agencyEmail: agencyEmail,
      permissions: ['SITE_MANAGER']
    });
  }

  async grantCustomAccess(options: ICustomAccessOptions): Promise<IBaseAccessResponse> {
    try {
      this.logger.log(`Granting My Business custom access to ${options.agencyEmail} for account ${options.entityId}`);
      this.logger.log(`Custom options: ${JSON.stringify({
        permissions: options.permissions,
        locationName: options.locationName,
        specificLocations: options.specificLocations,
        notifyUser: options.notifyUser
      })}`);

      const customOptions = options;

      if (customOptions.locationName) {
        return this.grantLocationAccess(
          options.entityId,
          customOptions.locationName,
          options.agencyEmail,
          options.permissions[0] as GoogleMyBusinessPermission
        );
      }

      if (customOptions.specificLocations && customOptions.specificLocations.length > 0) {
        return this.grantMultipleLocationAccess(
          options.entityId,
          customOptions.specificLocations,
          options.agencyEmail,
          options.permissions[0] as GoogleMyBusinessPermission
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
      this.logger.error(`Failed to grant My Business custom access: ${error.message}`, error);

      return {
        success: false,
        error: `Failed to grant custom access: ${error.message}`
      };
    }
  }

  setCredentials(tokens: { access_token?: string; refresh_token?: string }): void {
    if (isEmpty(tokens) || isNil(tokens)) {
      throw new Error('Tokens are required for Google My Business access management');
    }
    this.oauth2Client.setCredentials(tokens);
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<IBaseAccessResponse> {
    try {
      this.logger.log(`Granting Google My Business access to account ${request.entityId} for ${request.agencyEmail}`);

      const myBusinessAccountManagement = google.mybusinessaccountmanagement({
        version: 'v1',
        auth: this.oauth2Client
      });

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyEmail);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyEmail} already has access to account ${request.entityId}`);
        return {
          success: false,
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

      this.logger.log(`Successfully created My Business invitation for ${request.agencyEmail} to account ${request.entityId}`);

      return {
        success: true,
        linkId: response.data.name || 'invitation-created',
        entityId: request.entityId,
        message: `My Business invitation sent successfully to ${request.agencyEmail}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant Google My Business access: ${error.message}`, error);

      return {
        success: false,
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

  async getEntityUsers(entityId: string): Promise<IBaseUserInfo[]> {
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

  async revokeUserAccess(entityId: string, linkId: string): Promise<IBaseAccessResponse> {
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
        message: 'My Business access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke My Business access: ${error.message}`, error);

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

  getDefaultAgencyPermissions(): GoogleMyBusinessPermission[] {
    return ['MANAGER'];
  }

  getAllAvailablePermissions(): GoogleMyBusinessPermission[] {
    return ['OWNER', 'MANAGER', 'SITE_MANAGER'];
  }

  getRequiredScopes(): string[] {
    return [GOOGLE_MY_BUSINESS_MANAGE_SCOPE];
  }

  async grantMultipleLocationAccess(
    accountName: string,
    locationNames: string[],
    agencyEmail: string,
    role: GoogleMyBusinessPermission
  ): Promise<IBaseAccessResponse> {
    try {
      this.logger.log(`Granting My Business access to ${locationNames.length} locations for ${agencyEmail}`);

      const results = [];
      for (const locationName of locationNames) {
        try {
          const result = await this.grantLocationAccess(accountName, locationName, agencyEmail, role);
          results.push({ locationName, success: result.success, linkId: result.linkId });
        } catch (error) {
          results.push({ locationName, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      return {
        success: successCount > 0,
        message: `Multi-location access: ${successCount} successful, ${failureCount} failed`,
        linkId: `multi-location-${Date.now()}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant My Business multi-location access: ${error.message}`, error);

      return {
        success: false,
        error: `Failed to grant multi-location access: ${error.message}`
      };
    }
  }

  async grantLocationAccess(
    accountName: string,
    locationName: string,
    agencyEmail: string,
    role: GoogleMyBusinessPermission
  ): Promise<IBaseAccessResponse> {
    try {
      const myBusinessAccountManagement = google.mybusinessaccountmanagement({
        version: 'v1',
        auth: this.oauth2Client
      });

      const invitation = {
        targetLocation: locationName,
        targetType: 'LOCATION',
        role: role,
        inviterAccountId: accountName
      };

      const response = await myBusinessAccountManagement.locations.admins.create({
        parent: locationName,
        requestBody: invitation
      });

      this.logger.log(`Successfully created location invitation for ${agencyEmail} to location ${locationName}`);

      return {
        success: true,
        linkId: response.data.name || 'location-invitation-created',
        message: `Location access invitation sent successfully to ${agencyEmail}`
      };

    } catch (error) {
      this.logger.error(`Failed to grant My Business location access: ${error.message}`, error);

      return {
        success: false,
        error: `Failed to grant location access: ${error.message}`
      };
    }
  }
}
