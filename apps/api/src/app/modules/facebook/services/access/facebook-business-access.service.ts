import {
  FACEBOOK_BUSINESS_MANAGEMENT_SCOPE,
  FACEBOOK_ERROR_CODES,
  FacebookBusinessPermission,
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
export class FacebookBusinessAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookBusinessAccessService.name);
  private accessToken: string;

  constructor() {
  }

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Business access management');
    }

    this.accessToken = tokens.access_token;
  }

  async grantManagementAccess(businessId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Business management access to ${agencyEmail} for business ${businessId}`);

    return this.grantAgencyAccess({
      entityId: businessId,
      agencyIdentifier: agencyEmail,
      permissions: [FacebookBusinessPermission.ADMIN]
    });
  }

  async grantViewAccess(businessId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Business view access to ${agencyEmail} for business ${businessId}`);

    return this.grantAgencyAccess({
      entityId: businessId,
      agencyIdentifier: agencyEmail,
      permissions: [FacebookBusinessPermission.EMPLOYEE]
    });
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<TFacebookAccessResponse> {
    try {
      this.logger.log(`Attempting to grant Facebook Business access to ${request.agencyIdentifier} for business ${request.entityId}`);

      if (!this.accessToken) {
        throw new Error('Access token must be set before granting access');
      }

      const accessType: TAccessType = this.determineAccessType(request.permissions);

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyIdentifier);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyIdentifier} already has access to business ${request.entityId}`);
        return {
          success: false,
          service: FacebookServiceType.BUSINESS,
          accessType: accessType,
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'User already has access to this business',
          linkId: existingAccess.linkId
        };
      }

      // *** Facebook Business Manager requires manual user invitation ***
      // *** API does not support direct user addition for security reasons ***

      return {
        success: false,
        service: 'facebook',
        accessType: 'manage',
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        error: 'Facebook Business Manager requires manual user invitation through Business Manager interface',
        requiresManualApproval: true,
        businessManagerUrl: `https://business.facebook.com/${request.entityId}/settings/people`,
        message: `Please manually invite ${request.agencyIdentifier} through Facebook Business Manager. The user invitation must be sent through the Business Manager interface at https://business.facebook.com/${request.entityId}/settings/people`
      };

    } catch (error: any) {
      this.logger.error(`Failed to grant Facebook Business access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
        return {
          success: false,
          service: FacebookServiceType.BUSINESS,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Access token is invalid or expired'
        };
      }

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          service: FacebookServiceType.BUSINESS,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Insufficient permissions to manage business users'
        };
      }

      return {
        success: false,
        service: 'facebook',
        accessType: 'manage',
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

      const { data: response } = await facebookHttpClient.get(
        `/${entityId}/business_users`,
        {
          params: {
            fields: 'id,email,role,name,pending_email',
            access_token: this.accessToken
          }
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
        permissions: [existingUser.role || FacebookBusinessPermission.EMPLOYEE],
        kind: 'facebook#businessUser'
      };

    } catch (error: any) {
      this.logger.error(`Error checking existing Facebook Business user access: ${error.message}`);
      console.error(error);
      return null;
    }
  }

  async getEntityUsers(entityId: string): Promise<IBaseUserInfo[]> {
    try {
      if (!this.accessToken) {
        return [];
      }

      const { data: response } = await facebookHttpClient.get(
        `/${entityId}/business_users`,
        {
          params: {
            fields: 'id,email,role,name,pending_email',
            access_token: this.accessToken
          }
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((user: any) => ({
        linkId: user.id,
        email: user.email || user.pending_email || '',
        permissions: [user.role || FacebookBusinessPermission.EMPLOYEE],
        kind: 'facebook#businessUser'
      }));

    } catch (error: any) {
      this.logger.error(`Error fetching Facebook Business entity users: ${error.message}`);
      console.error(error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      await facebookHttpClient.delete(
        `/${entityId}/business_users`,
        {
          params: {
            user: linkId,
            access_token: this.accessToken
          }
        }
      );

      this.logger.log(`Successfully revoked Facebook Business access for user ${linkId} from business ${entityId}`);

      return {
        success: true,
        service: FacebookServiceType.BUSINESS,
        message: 'Facebook Business access revoked successfully'
      };

    } catch (error: any) {
      this.logger.error(`Failed to revoke Facebook Business access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          service: FacebookServiceType.BUSINESS,
          error: 'Insufficient permissions to remove business users'
        };
      }

      return {
        success: false,
        service: FacebookServiceType.BUSINESS,
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
    return [FACEBOOK_BUSINESS_MANAGEMENT_SCOPE];
  }

  private determineAccessType(permissions: string[]): 'view' | 'manage' {
    const firstPermission = permissions[0];
    return firstPermission === FacebookBusinessPermission.EMPLOYEE ? 'view' : 'manage';
  }
}
