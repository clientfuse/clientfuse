import {
  AccessType,
  ApiEnv,
  GOOGLE_ADWORDS_SCOPE,
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
import { enums, errors, GoogleAdsApi } from 'google-ads-api';
import { isEmpty, isNil } from 'lodash';

@Injectable()
export class GoogleAdsAccessService implements IGoogleBaseAccessService {
  private readonly logger = new Logger(GoogleAdsAccessService.name);
  private googleAdsClient: GoogleAdsApi = new GoogleAdsApi({
    client_id: this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_ID),
    client_secret: this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_SECRET),
    developer_token: this.configService.get<string>(ApiEnv.GOOGLE_ADS_DEVELOPER_TOKEN)
  });
  private accessToken: string;

  constructor(private readonly configService: ConfigService) {
  }

  setCredentials(tokens: { access_token?: string; refresh_token?: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Google Ads access management');
    }
    this.accessToken = tokens.access_token;
  }

  async grantManagementAccess(customerId: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting Google Ads management access to ${agencyEmail} for account ${customerId}`);

    const result = await this.grantAgencyAccess({
      entityId: customerId,
      agencyIdentifier: agencyEmail,
      permissions: ['ADMIN']
    });

    return {
      ...result,
      service: GoogleServiceType.ADS,
      accessType: AccessType.MANAGE,
      entityId: customerId,
      agencyIdentifier: agencyEmail
    };
  }

  async grantViewAccess(customerId: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting Google Ads view access to ${agencyEmail} for account ${customerId}`);

    const result = await this.grantAgencyAccess({
      entityId: customerId,
      agencyIdentifier: agencyEmail,
      permissions: ['READ_ONLY']
    });

    return {
      ...result,
      service: GoogleServiceType.ADS,
      accessType: AccessType.VIEW,
      entityId: customerId,
      agencyIdentifier: agencyEmail
    };
  }


  async grantAgencyAccess(request: IBaseAccessRequest): Promise<IGrantAccessResponse> {
    try {
      this.logger.log(`Granting Google Ads access to account ${request.entityId} for ${request.agencyIdentifier}`);

      if (!this.accessToken) {
        throw new Error('Credentials must be set before granting access');
      }

      const customer = this.googleAdsClient.Customer({
        customer_id: request.entityId,
        refresh_token: this.accessToken
      });

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyIdentifier);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyIdentifier} already has access to account ${request.entityId}`);
        return {
          success: false,
          service: GoogleServiceType.ADS,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: ServerErrorCode.USER_ALREADY_EXISTS,
          linkId: existingAccess.linkId
        };
      }

      const accessRole = this.mapPermissionToAccessRole(request.permissions[0]);

      const customerUserAccessInvitation = {
        email_address: request.agencyIdentifier.toLowerCase().trim(),
        access_role: accessRole
      };

      const response = await customer.customerUserAccessInvitations.create([customerUserAccessInvitation]);
      const resourceName = response?.result?.resource_name;

      if (resourceName) {
        this.logger.log(`Successfully sent Google Ads invitation to ${request.agencyIdentifier} for account ${request.entityId}`);

        return {
          success: true,
          service: GoogleServiceType.ADS,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          linkId: resourceName,
          message: `Google Ads access invitation sent successfully to ${request.agencyIdentifier}`
        };
      } else {
        throw new Error('No results returned from invitation creation');
      }

    } catch (error) {
      this.logger.error(`Failed to grant Google Ads access: ${error.message}`, error);

      if (error instanceof errors.GoogleAdsFailure) {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        return {
          success: false,
          service: GoogleServiceType.ADS,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: `Google Ads API error: ${errorMessages}`
        };
      }

      return {
        success: false,
        service: GoogleServiceType.ADS,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        error: `Failed to grant access: ${error.message}`
      };
    }
  }

  async checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const customer = this.googleAdsClient.Customer({
        customer_id: entityId,
        refresh_token: this.accessToken
      });

      const normalizedEmail = email.toLowerCase().trim();

      const results = await customer.query(`
        SELECT customer_user_access.resource_name,
               customer_user_access.email_address,
               customer_user_access.access_role,
               customer_user_access.user_id
        FROM customer_user_access
      `);

      const existingUser = results.find(
        (row: any) => row.customer_user_access?.email_address?.toLowerCase() === normalizedEmail
      );

      if (!existingUser) {
        return null;
      }

      return {
        linkId: existingUser.customer_user_access.resource_name,
        email: existingUser.customer_user_access.email_address,
        permissions: [existingUser.customer_user_access.access_role as string],
        kind: 'googleads#customerUserAccess'
      };

    } catch (error) {
      this.logger.error(`Error checking existing Google Ads user access: ${error.message}`, error);
      return null;
    }
  }

  async getEntityUsers(params: IBaseGetEntityUsersParams): Promise<IBaseUserInfo[]> {
    const { entityId } = params;
    try {
      if (!this.accessToken) {
        return [];
      }

      const customer = this.googleAdsClient.Customer({
        customer_id: entityId,
        refresh_token: this.accessToken
      });

      const results = await customer.query(`
        SELECT customer_user_access.resource_name,
               customer_user_access.email_address,
               customer_user_access.access_role,
               customer_user_access.user_id
        FROM customer_user_access
      `);

      return results.map((row: any) => ({
        linkId: row.customer_user_access.resource_name,
        email: row.customer_user_access.email_address || '',
        permissions: [row.customer_user_access.access_role as string],
        kind: 'googleads#customerUserAccess'
      }));

    } catch (error) {
      this.logger.error(`Error fetching Google Ads entity users: ${error.message}`, error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Credentials must be set before revoking access');
      }

      const customer = this.googleAdsClient.Customer({
        customer_id: entityId,
        refresh_token: this.accessToken
      });

      await customer.customerUserAccesses.remove([linkId]);

      this.logger.log(`Successfully revoked Google Ads access for ${linkId} from account ${entityId}`);

      return {
        success: true,
        service: GoogleServiceType.ADS,
        message: 'Google Ads access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke Google Ads access: ${error.message}`, error);

      if (error instanceof errors.GoogleAdsFailure) {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        return {
          success: false,
          service: GoogleServiceType.ADS,
          error: `Google Ads API error: ${errorMessages}`
        };
      }

      return {
        success: false,
        service: GoogleServiceType.ADS,
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
    return [GOOGLE_ADWORDS_SCOPE];
  }

  private mapPermissionToAccessRole(permission: string): enums.AccessRole {
    const permissionMap: Record<string, enums.AccessRole> = {
      'ADMIN': enums.AccessRole.ADMIN,
      'STANDARD': enums.AccessRole.STANDARD,
      'READ_ONLY': enums.AccessRole.READ_ONLY,
      'EMAIL_ONLY': enums.AccessRole.EMAIL_ONLY
    };

    return permissionMap[permission] || enums.AccessRole.READ_ONLY;
  }

  private determineAccessType(permissions: string[]): AccessType {
    const firstPermission = permissions[0];
    if (firstPermission === 'ADMIN' || firstPermission === 'STANDARD') {
      return AccessType.MANAGE;
    }
    return AccessType.VIEW;
  }
}
