import {
  FACEBOOK_CATALOG_MANAGEMENT_SCOPE,
  FACEBOOK_CATALOG_ROLES,
  FACEBOOK_ERROR_CODES,
  FacebookCatalogPermission,
  TFacebookAccessRequest,
  TFacebookAccessResponse,
  IFacebookBaseAccessService,
  TFacebookUserInfo,
  ApiEnv
} from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmpty, isNil } from 'lodash';
import { facebookHttpClient } from '../../../../core/utils/http';

@Injectable()
export class FacebookCatalogAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookCatalogAccessService.name);
  private accessToken: string;

  constructor(private readonly configService: ConfigService) {}

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Catalog access management');
    }

    this.accessToken = tokens.access_token;
  }

  async grantManagementAccess(catalogId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Catalog management access to ${agencyEmail} for catalog ${catalogId}`);

    return this.grantAgencyAccess({
      entityId: catalogId,
      agencyEmail: agencyEmail,
      permissions: [FacebookCatalogPermission.ADMIN],
      roleType: FacebookCatalogPermission.ADMIN
    });
  }

  async grantViewAccess(catalogId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Catalog view access to ${agencyEmail} for catalog ${catalogId}`);

    return this.grantAgencyAccess({
      entityId: catalogId,
      agencyEmail: agencyEmail,
      permissions: [FacebookCatalogPermission.ADVERTISER],
      roleType: FacebookCatalogPermission.ADVERTISER
    });
  }

  async grantAgencyAccess(request: TFacebookAccessRequest): Promise<TFacebookAccessResponse> {
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

      const role = this.mapPermissionToRole(request.permissions[0] || FacebookCatalogPermission.ADVERTISER);

      try {
        const { data: response } = await facebookHttpClient.post(
          `/${request.entityId}/collaborators`,
          {},
          {
            params: {
              email: request.agencyEmail,
              role: role,
              access_token: this.accessToken
            }
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

    } catch (error: any) {
      this.logger.error(`Failed to grant Facebook Catalog access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
        return {
          success: false,
          error: 'Access token is invalid or expired'
        };
      }

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
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

  async checkExistingUserAccess(entityId: string, email: string): Promise<TFacebookUserInfo | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const { data: response } = await facebookHttpClient.get(
        `/${entityId}/collaborators`,
        {
          params: {
            fields: 'id,email,role,status',
            access_token: this.accessToken
          }
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
        permissions: [existingUser.role || FacebookCatalogPermission.ADVERTISER],
        kind: 'facebook#catalogCollaborator',
        status: existingUser.status || 'ACTIVE',
        roleType: existingUser.role
      };

    } catch (error: any) {
      this.logger.error(`Error checking existing Facebook Catalog user access: ${error.message}`);
      console.error(error);
      return null;
    }
  }

  async getEntityUsers(entityId: string): Promise<TFacebookUserInfo[]> {
    try {
      if (!this.accessToken) {
        return [];
      }

      const { data: response } = await facebookHttpClient.get(
        `/${entityId}/collaborators`,
        {
          params: {
            fields: 'id,email,role,status',
            access_token: this.accessToken
          }
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((collaborator: any) => ({
        linkId: collaborator.id || `${entityId}_${collaborator.email}`,
        email: collaborator.email || '',
        permissions: [collaborator.role || FacebookCatalogPermission.ADVERTISER],
        kind: 'facebook#catalogCollaborator',
        status: collaborator.status || 'ACTIVE',
        roleType: collaborator.role
      }));

    } catch (error: any) {
      this.logger.error(`Error fetching Facebook Catalog entity users: ${error.message}`);
      console.error(error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<TFacebookAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      const collaboratorId = linkId.includes('_') ? linkId.split('_')[1] : linkId;

      await facebookHttpClient.delete(
        `/${entityId}/collaborators`,
        {
          params: {
            email: collaboratorId,
            access_token: this.accessToken
          }
        }
      );

      this.logger.log(`Successfully revoked Facebook Catalog access for user ${collaboratorId} from catalog ${entityId}`);

      return {
        success: true,
        message: 'Facebook Catalog access revoked successfully'
      };

    } catch (error: any) {
      this.logger.error(`Failed to revoke Facebook Catalog access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
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

  getRequiredScopes(): string[] {
    return [FACEBOOK_CATALOG_MANAGEMENT_SCOPE];
  }

  async getCatalogInfo(catalogId: string): Promise<any> {
    try {
      const { data: response } = await facebookHttpClient.get(
        `/${catalogId}`,
        {
          params: {
            fields: 'id,name,business,product_count,vertical',
            access_token: this.accessToken
          }
        }
      );

      return response;

    } catch (error: any) {
      this.logger.error(`Error fetching catalog info: ${error.message}`);
      console.error(error);
      return null;
    }
  }

  private mapPermissionToRole(permission: string): string {
    const roleMap: Record<string, string> = {
      [FacebookCatalogPermission.ADMIN]: FACEBOOK_CATALOG_ROLES.ADMIN,
      [FacebookCatalogPermission.ADVERTISER]: FACEBOOK_CATALOG_ROLES.ADVERTISER
    };

    return roleMap[permission] || FACEBOOK_CATALOG_ROLES.ADVERTISER;
  }
}
