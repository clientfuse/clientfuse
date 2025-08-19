import {
  FACEBOOK_BUSINESS_MANAGEMENT_SCOPE,
  FACEBOOK_BUSINESS_ROLES,
  FACEBOOK_ERROR_CODES,
  FACEBOOK_SCOPES,
  FacebookBusinessPermission,
  IFacebookAccessRequest,
  IFacebookAccessResponse,
  IFacebookBaseAccessService,
  IFacebookCustomAccessOptions,
  IFacebookUserInfo
} from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { FacebookAdsApi } from 'facebook-nodejs-business-sdk';
import { isEmpty, isNil } from 'lodash';

@Injectable()
export class FacebookBusinessAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookBusinessAccessService.name);
  private facebookApi: FacebookAdsApi;
  private accessToken: string;

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Business access management');
    }

    this.accessToken = tokens.access_token;
    this.facebookApi = FacebookAdsApi.init(this.accessToken);
  }

  async grantManagementAccess(businessId: string, agencyEmail: string): Promise<IFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Business management access to ${agencyEmail} for business ${businessId}`);

    return this.grantAgencyAccess({
      entityId: businessId,
      agencyEmail: agencyEmail,
      permissions: ['ADMIN'],
      roleType: 'ADMIN'
    });
  }

  async grantReadOnlyAccess(businessId: string, agencyEmail: string): Promise<IFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Business read-only access to ${agencyEmail} for business ${businessId}`);

    return this.grantAgencyAccess({
      entityId: businessId,
      agencyEmail: agencyEmail,
      permissions: ['EMPLOYEE'],
      roleType: 'EMPLOYEE'
    });
  }

  async grantCustomAccess(options: IFacebookCustomAccessOptions): Promise<IFacebookAccessResponse> {
    try {
      this.logger.log(`Granting Facebook Business custom access to ${options.agencyEmail} for business ${options.entityId}`);

      const result = await this.grantAgencyAccess({
        entityId: options.entityId,
        agencyEmail: options.agencyEmail,
        permissions: options.permissions,
        roleType: options.roleType
      });

      if (options.customMessage && result.success) {
        result.message = `${result.message} - ${options.customMessage}`;
      }

      return result;

    } catch (error) {
      this.logger.error(`Failed to grant Facebook Business custom access: ${error.message}`, error);
      return {
        success: false,
        error: `Failed to grant custom access: ${error.message}`
      };
    }
  }

  async grantAgencyAccess(request: IFacebookAccessRequest): Promise<IFacebookAccessResponse> {
    try {
      this.logger.log(`Attempting to grant Facebook Business access to ${request.agencyEmail} for business ${request.entityId}`);

      if (!this.accessToken) {
        throw new Error('Access token must be set before granting access');
      }

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyEmail);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyEmail} already has access to business ${request.entityId}`);
        return {
          success: false,
          error: 'User already has access to this business',
          linkId: existingAccess.linkId
        };
      }

      // *** Facebook Business Manager requires manual user invitation ***
      // *** API does not support direct user addition for security reasons ***

      return {
        success: false,
        error: 'Facebook Business Manager requires manual user invitation through Business Manager interface',
        requiresManualApproval: true,
        businessManagerUrl: `https://business.facebook.com/${request.entityId}/settings/people`,
        message: `Please manually invite ${request.agencyEmail} through Facebook Business Manager. The user invitation must be sent through the Business Manager interface at https://business.facebook.com/${request.entityId}/settings/people`
      };

    } catch (error) {
      this.logger.error(`Failed to grant Facebook Business access: ${error.message}`, error);

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
        return {
          success: false,
          error: 'Access token is invalid or expired'
        };
      }

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          error: 'Insufficient permissions to manage business users'
        };
      }

      return {
        success: false,
        error: `Failed to grant access: ${error.message}`
      };
    }
  }

  async checkExistingUserAccess(entityId: string, email: string): Promise<IFacebookUserInfo | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const response = await this.facebookApi.call<any>(
        'GET',
        `/${entityId}/business_users`,
        {
          fields: 'id,email,role,name,pending_email'
        }
      );

      if (isNil(response.data)) {
        return null;
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = response.data.find((user: any) =>
        user.email?.toLowerCase() === normalizedEmail ||
        user.pending_email?.toLowerCase() === normalizedEmail
      );

      if (!existingUser) {
        return null;
      }

      return {
        linkId: existingUser.id,
        email: existingUser.email || existingUser.pending_email || email,
        permissions: [existingUser.role || 'EMPLOYEE'],
        kind: 'facebook#businessUser',
        status: existingUser.pending_email ? 'PENDING' : 'ACTIVE',
        roleType: existingUser.role
      };

    } catch (error) {
      this.logger.error(`Error checking existing Facebook Business user access: ${error.message}`, error);
      return null;
    }
  }

  async getEntityUsers(entityId: string): Promise<IFacebookUserInfo[]> {
    try {
      if (!this.accessToken) {
        return [];
      }

      // *** Get all business users ***
      const response = await this.facebookApi.call<any>(
        'GET',
        `/${entityId}/business_users`,
        {
          fields: 'id,email,role,name,pending_email'
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((user: any) => ({
        linkId: user.id,
        email: user.email || user.pending_email || '',
        permissions: [user.role || 'EMPLOYEE'],
        kind: 'facebook#businessUser',
        status: user.pending_email ? 'PENDING' : 'ACTIVE',
        roleType: user.role
      }));

    } catch (error) {
      this.logger.error(`Error fetching Facebook Business entity users: ${error.message}`, error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IFacebookAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      // *** Remove business user ***
      await this.facebookApi.call<any>(
        'DELETE',
        `/${entityId}/business_users`,
        {
          user: linkId
        }
      );

      this.logger.log(`Successfully revoked Facebook Business access for user ${linkId} from business ${entityId}`);

      return {
        success: true,
        message: 'Facebook Business access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke Facebook Business access: ${error.message}`, error);

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          error: 'Insufficient permissions to remove business users'
        };
      }

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

  getDefaultAgencyPermissions(): FacebookBusinessPermission[] {
    return ['EMPLOYEE'];
  }

  getAllAvailablePermissions(): string[] {
    return Object.values(FACEBOOK_BUSINESS_ROLES);
  }

  getRequiredScopes(): string[] {
    return [FACEBOOK_BUSINESS_MANAGEMENT_SCOPE];
  }

  async getBusinessInfo(businessId: string): Promise<any> {
    try {
      const response = await this.facebookApi.call(
        'GET',
        `/${businessId}`,
        {
          fields: 'id,name,verification_status,created_time,updated_time'
        }
      );

      return response;

    } catch (error) {
      this.logger.error(`Error fetching business info: ${error.message}`, error);
      return null;
    }
  }
}
