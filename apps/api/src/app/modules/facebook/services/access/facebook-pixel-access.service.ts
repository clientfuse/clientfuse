import {
  FACEBOOK_ADS_MANAGEMENT_SCOPE,
  FACEBOOK_ERROR_CODES,
  FacebookPixelPermission,
  FacebookServiceType,
  IBaseAccessRequest,
  IBaseUserInfo,
  IFacebookBaseAccessService,
  IRevokeAccessResponse,
  TAccessType,
  TFacebookAccessResponse
} from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { isEmpty, isNil } from 'lodash';
import { facebookHttpClient } from '../../../../core/utils/http';

@Injectable()
export class FacebookPixelAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookPixelAccessService.name);
  private accessToken: string;

  constructor() {
  }

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Pixel access management');
    }

    this.accessToken = tokens.access_token;
  }

  async grantManagementAccess(pixelId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    // Note: agencyEmail parameter actually contains the Facebook business account ID, not an email
    this.logger.log(`Granting Facebook Pixel management access to business account ${agencyEmail} for pixel ${pixelId}`);

    const result = await this.grantAgencyAccess({
      entityId: pixelId,
      agencyIdentifier: agencyEmail, // This is actually a business account ID
      permissions: [FacebookPixelPermission.ADMIN]
    });

    return {
      ...result,
      service: FacebookServiceType.PIXEL,
      accessType: 'manage' as TAccessType,
      entityId: pixelId,
      agencyIdentifier: agencyEmail
    };
  }

  async grantViewAccess(pixelId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    // Note: agencyEmail parameter actually contains the Facebook business account ID, not an email
    this.logger.log(`Granting Facebook Pixel view access to business account ${agencyEmail} for pixel ${pixelId}`);

    const result = await this.grantAgencyAccess({
      entityId: pixelId,
      agencyIdentifier: agencyEmail, // This is actually a business account ID
      permissions: [FacebookPixelPermission.ADVERTISER]
    });

    return {
      ...result,
      service: FacebookServiceType.PIXEL,
      accessType: 'view' as TAccessType,
      entityId: pixelId,
      agencyIdentifier: agencyEmail
    };
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<TFacebookAccessResponse> {
    try {
      // IMPORTANT: The agencyEmail field actually contains a Facebook business account ID, not an email address
      // This is because Facebook's API requires account IDs for access management, not email addresses
      const businessAccountId = request.agencyIdentifier; // This is actually a business account ID

      this.logger.log(`Attempting to grant Facebook Pixel access to business account ${businessAccountId} for pixel ${request.entityId}`);

      if (!this.accessToken) {
        throw new Error('Access token must be set before granting access');
      }

      const existingAccess = await this.checkExistingUserAccess(request.entityId, businessAccountId);

      if (existingAccess) {
        this.logger.warn(`Business account ${businessAccountId} already has access to pixel ${request.entityId}`);
        return {
          success: false,
          service: FacebookServiceType.PIXEL,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: businessAccountId,
          error: 'Business account already has access to this pixel',
          linkId: existingAccess.linkId
        };
      }

      try {
        const { data: response } = await facebookHttpClient.post(
          `/${request.entityId}/shared_accounts`,
          {},
          {
            params: {
              account_id: businessAccountId, // Business account ID to share with
              business: businessAccountId, // The business ID (same as account_id in this case)
              access_token: this.accessToken
            }
          }
        );

        if (response.success !== false) {
          this.logger.log(`Successfully granted Facebook Pixel access to business account ${businessAccountId} for pixel ${request.entityId}`);

          return {
            success: true,
            service: FacebookServiceType.PIXEL,
            accessType: this.determineAccessType(request.permissions),
            entityId: request.entityId,
            agencyIdentifier: businessAccountId,
            linkId: `${request.entityId}_${businessAccountId}`,
            message: `Facebook Pixel access granted successfully to business account ${businessAccountId}`
          };
        } else {
          throw new Error('Failed to share pixel with business account');
        }

      } catch (apiError: any) {
        this.logger.warn(`API method failed, may require manual pixel access assignment: ${apiError.message}`);
        console.error(apiError);

        return {
          success: false,
          service: FacebookServiceType.PIXEL,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: businessAccountId,
          error: 'Facebook Pixel access requires manual intervention through Business Manager',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/pixels/${request.entityId}`,
          message: `Please manually share the pixel with business account ${businessAccountId} through Business Manager at https://business.facebook.com/settings/pixels/${request.entityId}`
        };
      }

    } catch (error: any) {
      this.logger.error(`Failed to grant Facebook Pixel access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
        return {
          success: false,
          service: FacebookServiceType.PIXEL,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Access token is invalid or expired'
        };
      }

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          service: FacebookServiceType.PIXEL,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Insufficient permissions to manage pixel sharing. You must be an admin of this pixel.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/pixels/${request.entityId}`
        };
      }

      return {
        success: false,
        service: FacebookServiceType.PIXEL,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        error: `Failed to grant access: ${error.message}`,
        requiresManualApproval: true,
        businessManagerUrl: `https://business.facebook.com/settings/pixels/${request.entityId}`
      };
    }
  }

  async checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      // Note: The 'email' parameter actually contains a Facebook business account ID
      const businessAccountId = email;

      // Note: This requires a business parameter which we're using the same businessAccountId for
      const { data: response } = await facebookHttpClient.get(
        `/${entityId}/assigned_users`,
        {
          params: {
            business: businessAccountId, // Business ID is required for this endpoint
            access_token: this.accessToken
          }
        }
      );

      if (isNil(response.data)) {
        return null;
      }

      // Check if the business account has access
      // Note: The response contains user IDs with tasks/permissions, not email addresses
      const existingUser = response.data.find((user: any) =>
        user.id === businessAccountId ||
        user.business?.id === businessAccountId
      );

      if (!existingUser) {
        return null;
      }

      return {
        linkId: existingUser.id || `${entityId}_${businessAccountId}`,
        email: businessAccountId, // Storing business account ID in email field
        permissions: existingUser.tasks || [FacebookPixelPermission.ADVERTISER],
        kind: 'facebook#pixelUser'
      };

    } catch (error: any) {
      // If the endpoint fails, it likely means no access exists
      this.logger.debug(`Error checking existing Facebook Pixel user access: ${error.message}`);
      return null;
    }
  }

  async getEntityUsers(entityId: string): Promise<IBaseUserInfo[]> {
    try {
      if (!this.accessToken) {
        return [];
      }

      // Get pixel info to find the owner business
      const pixelInfo = await this.getPixelInfo(entityId);
      if (!pixelInfo?.owner_business?.id) {
        this.logger.warn(`Cannot retrieve pixel users - no owner business found for pixel ${entityId}`);
        return [];
      }

      const businessId = pixelInfo.owner_business.id;

      // Use assigned_users endpoint with the business ID
      const { data: response } = await facebookHttpClient.get(
        `/${entityId}/assigned_users`,
        {
          params: {
            business: businessId, // Use the owner business ID
            access_token: this.accessToken
          }
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      // Note: These are business account IDs, not email addresses
      return response.data.map((user: any) => ({
        linkId: user.id || `${entityId}_${user.business?.id}`,
        email: user.business?.id || user.id || '', // Storing business account ID in email field
        permissions: user.tasks || [FacebookPixelPermission.ADVERTISER],
        kind: 'facebook#pixelUser'
      }));

    } catch (error: any) {
      this.logger.error(`Error fetching Facebook Pixel entity users: ${error.message}`);
      console.error(error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      // Extract business account ID from linkId (format: pixelId_businessAccountId)
      const businessAccountId = linkId.includes('_') ? linkId.split('_')[1] : linkId;

      // Use the shared_accounts endpoint to revoke access from a business account
      await facebookHttpClient.delete(
        `/${entityId}/shared_accounts`,
        {
          params: {
            account_id: businessAccountId, // Business account ID to revoke
            business: businessAccountId, // The business ID (same as account_id in this case)
            access_token: this.accessToken
          }
        }
      );

      this.logger.log(`Successfully revoked Facebook Pixel access for business account ${businessAccountId} from pixel ${entityId}`);

      return {
        success: true,
        service: FacebookServiceType.PIXEL,
        message: 'Facebook Pixel access revoked successfully'
      };

    } catch (error: any) {
      this.logger.error(`Failed to revoke Facebook Pixel access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          service: FacebookServiceType.PIXEL,
          error: 'Insufficient permissions to remove pixel sharing. Manual removal may be required.'
        };
      }

      return {
        success: false,
        service: FacebookServiceType.PIXEL,
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
    return [FACEBOOK_ADS_MANAGEMENT_SCOPE];
  }

  async getPixelInfo(pixelId: string): Promise<any> {
    try {
      const { data: response } = await facebookHttpClient.get(
        `/${pixelId}`,
        {
          params: {
            fields: 'id,name,creation_time,last_fired_time,owner_business',
            access_token: this.accessToken
          }
        }
      );

      return response;

    } catch (error: any) {
      this.logger.error(`Error fetching pixel info: ${error.message}`);
      console.error(error);
      return null;
    }
  }

  private determineAccessType(permissions: string[]): TAccessType {
    if (permissions.includes(FacebookPixelPermission.ADMIN)) {
      return 'manage';
    }
    return 'view';
  }
}
