import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FacebookAdsApi } from 'facebook-nodejs-business-sdk';
import { isEmpty, isNil } from 'lodash';
import {
  FACEBOOK_CATALOG_ROLES,
  FACEBOOK_ERROR_CODES,
  FACEBOOK_SCOPES,
  IFacebookAccessRequest,
  IFacebookAccessResponse,
  IFacebookBaseAccessService,
  IFacebookCustomAccessOptions,
  IFacebookUserInfo
} from '../../models/facebook.model';

@Injectable()
export class FacebookCatalogAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookCatalogAccessService.name);
  private facebookApi: FacebookAdsApi;
  private accessToken: string;

  constructor() {
  }

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Catalog access management');
    }

    this.accessToken = tokens.access_token;
    this.facebookApi = FacebookAdsApi.init(this.accessToken);
  }

  async grantManagementAccess(catalogId: string, agencyEmail: string): Promise<IFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Catalog management access to ${agencyEmail} for catalog ${catalogId}`);

    return this.grantAgencyAccess({
      entityId: catalogId,
      agencyEmail: agencyEmail,
      permissions: ['ADMIN'],
      roleType: 'ADMIN'
    });
  }

  async grantReadOnlyAccess(catalogId: string, agencyEmail: string): Promise<IFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Catalog read-only access to ${agencyEmail} for catalog ${catalogId}`);

    return this.grantAgencyAccess({
      entityId: catalogId,
      agencyEmail: agencyEmail,
      permissions: ['ADVERTISER'],
      roleType: 'ADVERTISER'
    });
  }

  async grantCustomAccess(options: IFacebookCustomAccessOptions): Promise<IFacebookAccessResponse> {
    try {
      this.logger.log(`Granting Facebook Catalog custom access to ${options.agencyEmail} for catalog ${options.entityId}`);

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
      this.logger.error(`Failed to grant Facebook Catalog custom access: ${error.message}`, error);
      return {
        success: false,
        error: `Failed to grant custom access: ${error.message}`
      };
    }
  }

  async grantAgencyAccess(request: IFacebookAccessRequest): Promise<IFacebookAccessResponse> {
    try {
      this.logger.log(`Attempting to grant Facebook Catalog access to ${request.agencyEmail} for catalog ${request.entityId}`);

      if (!this.accessToken) {
        throw new Error('Access token must be set before granting access');
      }

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyEmail);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyEmail} already has access to catalog ${request.entityId}`);
        return {
          success: false,
          error: 'User already has access to this catalog',
          linkId: existingAccess.linkId
        };
      }

      const role = this.mapPermissionToRole(request.permissions[0] || 'ADVERTISER');

      try {
        const response = await this.facebookApi.call<any>(
          'POST',
          `/${request.entityId}/collaborators`,
          {
            email: request.agencyEmail,
            role: role
          }
        );

        if (response.success !== false) {
          this.logger.log(`Successfully granted Facebook Catalog access to ${request.agencyEmail} for catalog ${request.entityId}`);

          return {
            success: true,
            linkId: `${request.entityId}_${request.agencyEmail}`,
            entityId: request.entityId,
            message: `Facebook Catalog access granted successfully to ${request.agencyEmail}`
          };
        } else {
          throw new Error('Failed to add collaborator to catalog');
        }

      } catch (apiError) {
        this.logger.warn(`API method failed, may require manual catalog collaboration assignment: ${apiError.message}`);

        return {
          success: false,
          error: 'Facebook Catalog collaboration requires manual intervention through Business Manager',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/commerce/catalogs/${request.entityId}/collaborators`,
          message: `Please manually add ${request.agencyEmail} as a collaborator with ${role} role through Business Manager at https://business.facebook.com/commerce/catalogs/${request.entityId}/collaborators`
        };
      }

    } catch (error) {
      this.logger.error(`Failed to grant Facebook Catalog access: ${error.message}`, error);

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
        return {
          success: false,
          error: 'Access token is invalid or expired'
        };
      }

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          error: 'Insufficient permissions to manage catalog collaborators. You must be an admin of this catalog.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/commerce/catalogs/${request.entityId}/collaborators`
        };
      }

      return {
        success: false,
        error: `Failed to grant access: ${error.message}`,
        requiresManualApproval: true,
        businessManagerUrl: `https://business.facebook.com/commerce/catalogs/${request.entityId}/collaborators`
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
        `/${entityId}/collaborators`,
        {
          fields: 'id,email,role,status'
        }
      );

      if (isNil(response.data)) {
        return null;
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = response.data.find((collaborator: any) =>
        collaborator.email?.toLowerCase() === normalizedEmail
      );

      if (!existingUser) {
        return null;
      }

      return {
        linkId: existingUser.id || `${entityId}_${existingUser.email}`,
        email: existingUser.email || email,
        permissions: [existingUser.role || 'ADVERTISER'],
        kind: 'facebook#catalogCollaborator',
        status: existingUser.status || 'ACTIVE',
        roleType: existingUser.role
      };

    } catch (error) {
      this.logger.error(`Error checking existing Facebook Catalog user access: ${error.message}`, error);
      return null;
    }
  }

  async getEntityUsers(entityId: string): Promise<IFacebookUserInfo[]> {
    try {
      if (!this.accessToken) {
        return [];
      }

      const response = await this.facebookApi.call<any>(
        'GET',
        `/${entityId}/collaborators`,
        {
          fields: 'id,email,role,status'
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((collaborator: any) => ({
        linkId: collaborator.id || `${entityId}_${collaborator.email}`,
        email: collaborator.email || '',
        permissions: [collaborator.role || 'ADVERTISER'],
        kind: 'facebook#catalogCollaborator',
        status: collaborator.status || 'ACTIVE',
        roleType: collaborator.role
      }));

    } catch (error) {
      this.logger.error(`Error fetching Facebook Catalog entity users: ${error.message}`, error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IFacebookAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      const collaboratorId = linkId.includes('_') ? linkId.split('_')[1] : linkId;

      await this.facebookApi.call(
        'DELETE',
        `/${entityId}/collaborators`,
        {
          email: collaboratorId // Use email for deletion
        }
      );

      this.logger.log(`Successfully revoked Facebook Catalog access for user ${collaboratorId} from catalog ${entityId}`);

      return {
        success: true,
        message: 'Facebook Catalog access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke Facebook Catalog access: ${error.message}`, error);

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          error: 'Insufficient permissions to remove catalog collaborators. Manual removal may be required.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/commerce/catalogs/${entityId}/collaborators`
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

  getDefaultAgencyPermissions(): string[] {
    return ['ADVERTISER'];
  }

  getAllAvailablePermissions(): string[] {
    return Object.values(FACEBOOK_CATALOG_ROLES);
  }

  getRequiredScopes(): string[] {
    return [FACEBOOK_SCOPES.CATALOG_MANAGEMENT];
  }

  async getCatalogInfo(catalogId: string): Promise<any> {
    try {
      const response = await this.facebookApi.call(
        'GET',
        `/${catalogId}`,
        {
          fields: 'id,name,business,product_count,vertical'
        }
      );

      return response;

    } catch (error) {
      this.logger.error(`Error fetching catalog info: ${error.message}`, error);
      return null;
    }
  }

  private mapPermissionToRole(permission: string): string {
    const roleMap: Record<string, string> = {
      'ADMIN': FACEBOOK_CATALOG_ROLES.ADMIN,
      'ADVERTISER': FACEBOOK_CATALOG_ROLES.ADVERTISER,
      'MANAGER': FACEBOOK_CATALOG_ROLES.ADMIN,
      'READ_ONLY': FACEBOOK_CATALOG_ROLES.ADVERTISER,
      'EDIT': FACEBOOK_CATALOG_ROLES.ADMIN
    };

    return roleMap[permission] || FACEBOOK_CATALOG_ROLES.ADVERTISER;
  }
}
