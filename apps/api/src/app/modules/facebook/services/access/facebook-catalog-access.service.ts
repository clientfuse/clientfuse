import {
  AccessType,
  FACEBOOK_CATALOG_MANAGEMENT_SCOPE,
  FACEBOOK_CATALOG_TASKS,
  FACEBOOK_ERROR_CODES,
  FacebookCatalogPermission,
  FacebookServiceType,
  IBaseAccessRequest,
  IBaseUserInfo,
  IFacebookBaseAccessService,
  IRevokeAccessResponse,
  TFacebookAccessResponse
} from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { isEmpty, isNil } from 'lodash';
import { facebookHttpClient } from '../../../../core/utils/http';

@Injectable()
export class FacebookCatalogAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookCatalogAccessService.name);
  private accessToken: string;

  constructor() {
  }

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Catalog access management');
    }

    this.accessToken = tokens.access_token;
  }

  async grantManagementAccess(catalogId: string, agencyBusinessPortfolioId: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Catalog management access to business ${agencyBusinessPortfolioId} for catalog ${catalogId}`);

    const result = await this.grantAgencyAccess({
      entityId: catalogId,
      agencyIdentifier: agencyBusinessPortfolioId,
      permissions: [FacebookCatalogPermission.ADMIN]
    });

    return {
      ...result,
      service: FacebookServiceType.CATALOG,
      accessType: AccessType.MANAGE,
      entityId: catalogId,
      agencyIdentifier: agencyBusinessPortfolioId
    };
  }

  async grantViewAccess(catalogId: string, agencyBusinessPortfolioId: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Catalog view access to business ${agencyBusinessPortfolioId} for catalog ${catalogId}`);

    const result = await this.grantAgencyAccess({
      entityId: catalogId,
      agencyIdentifier: agencyBusinessPortfolioId,
      permissions: [FacebookCatalogPermission.ADVERTISER]
    });

    return {
      ...result,
      service: FacebookServiceType.CATALOG,
      accessType: AccessType.VIEW,
      entityId: catalogId,
      agencyIdentifier: agencyBusinessPortfolioId
    };
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<TFacebookAccessResponse> {
    try {
      this.logger.log(`Attempting to grant Facebook Catalog access to business ${request.agencyIdentifier} for catalog ${request.entityId}`);

      if (!this.accessToken) {
        throw new Error('Access token must be set before granting access');
      }

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyIdentifier);

      if (existingAccess) {
        this.logger.warn(`Business ${request.agencyIdentifier} already has access to catalog ${request.entityId}`);
        return {
          success: false,
          service: FacebookServiceType.CATALOG,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Business already has access to this catalog',
          linkId: existingAccess.linkId
        };
      }

      // Map permission to tasks for catalog
      const tasks = this.mapPermissionToTasks(request.permissions[0] || FacebookCatalogPermission.ADVERTISER);

      try {
        const { data: response } = await facebookHttpClient.post(
          `/${request.entityId}/agencies`,
          {
            business: request.agencyIdentifier,
            permitted_tasks: tasks
          },
          {
            params: {
              access_token: this.accessToken
            }
          }
        );

        if (response.success !== false) {
          this.logger.log(`Successfully granted Facebook Catalog access to business ${request.agencyIdentifier} for catalog ${request.entityId}`);

          return {
            success: true,
            service: FacebookServiceType.CATALOG,
            accessType: this.determineAccessType(request.permissions),
            entityId: request.entityId,
            agencyIdentifier: request.agencyIdentifier,
            linkId: `${request.entityId}_${request.agencyIdentifier}`,
            message: `Facebook Catalog access granted successfully to business ${request.agencyIdentifier}`
          };
        } else {
          throw new Error('Failed to add business to catalog');
        }

      } catch (apiError: any) {
        this.logger.error(`Failed to grant access via agencies endpoint: ${apiError.message}`);
        console.error('API Error details:', apiError.response?.data);

        return {
          success: false,
          service: FacebookServiceType.CATALOG,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Unable to grant access via API. Manual intervention required.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/commerce/catalogs/${request.entityId}/collaborators`,
          message: `Please manually add business ${request.agencyIdentifier} as a collaborator through Business Manager`
        };
      }

    } catch (error: any) {
      this.logger.error(`Failed to grant Facebook Catalog access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
        return {
          success: false,
          service: FacebookServiceType.CATALOG,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Access token is invalid or expired'
        };
      }

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          service: FacebookServiceType.CATALOG,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Insufficient permissions to manage catalog. You must be an admin of this catalog.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/commerce/catalogs/${request.entityId}/collaborators`
        };
      }

      return {
        success: false,
        service: FacebookServiceType.CATALOG,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        error: `Failed to grant access: ${error.message}`,
        requiresManualApproval: true,
        businessManagerUrl: `https://business.facebook.com/commerce/catalogs/${request.entityId}/collaborators`
      };
    }
  }

  async checkExistingUserAccess(entityId: string, businessId: string): Promise<IBaseUserInfo | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const { data: response } = await facebookHttpClient.get(
        `/${entityId}/agencies`,
        {
          params: {
            access_token: this.accessToken
          }
        }
      );

      if (isNil(response.data)) {
        return null;
      }

      const existingBusiness = response.data.find((agency: any) => {
        return agency.id === businessId || agency.business === businessId;
      });

      if (!existingBusiness) {
        return null;
      }

      return {
        linkId: `${entityId}_${businessId}`,
        email: businessId, // Using businessId for compatibility
        permissions: existingBusiness.permitted_tasks || [FacebookCatalogPermission.ADVERTISER],
        kind: 'facebook#catalogUser'
      };

    } catch (error: any) {
      this.logger.error(`Error checking existing Facebook Catalog business access: ${error.message}`);
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
        `/${entityId}/agencies`,
        {
          params: {
            access_token: this.accessToken
          }
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((agency: any) => {
        const businessId = agency.id || agency.business || '';
        return {
          linkId: `${entityId}_${businessId}`,
          email: businessId, // Using business ID as identifier
          permissions: agency.permitted_tasks || [FacebookCatalogPermission.ADVERTISER],
          kind: 'facebook#catalogUser'
        };
      });

    } catch (error: any) {
      this.logger.error(`Error fetching Facebook Catalog agencies: ${error.message}`);
      console.error(error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      // Extract business ID from linkId
      const businessId = linkId.includes('_') ? linkId.split('_')[1] : linkId;

      await facebookHttpClient.delete(
        `/${entityId}/agencies`,
        {
          params: {
            business: businessId,
            access_token: this.accessToken
          }
        }
      );

      this.logger.log(`Successfully revoked Facebook Catalog access for business ${businessId} from catalog ${entityId}`);

      return {
        success: true,
        service: FacebookServiceType.CATALOG,
        message: 'Facebook Catalog access revoked successfully'
      };

    } catch (error: any) {
      this.logger.error(`Failed to revoke Facebook Catalog access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          service: FacebookServiceType.CATALOG,
          error: 'Insufficient permissions to remove catalog agencies. Manual removal may be required.'
        };
      }

      return {
        success: false,
        service: FacebookServiceType.CATALOG,
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

  private mapPermissionToTasks(permission: string): string[] {
    if (permission === FacebookCatalogPermission.ADMIN) {
      return [FACEBOOK_CATALOG_TASKS.MANAGE, FACEBOOK_CATALOG_TASKS.ADVERTISE];
    }
    return [FACEBOOK_CATALOG_TASKS.ADVERTISE];
  }

  private determineAccessType(permissions: string[]): AccessType {
    if (permissions.includes(FacebookCatalogPermission.ADMIN)) {
      return AccessType.MANAGE;
    }
    return AccessType.VIEW;
  }

}
