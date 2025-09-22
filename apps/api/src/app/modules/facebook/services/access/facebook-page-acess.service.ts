import {
  FACEBOOK_CATALOG_MANAGEMENT_SCOPE,
  FACEBOOK_ERROR_CODES,
  FACEBOOK_PAGES_SHOW_LIST_SCOPE,
  FacebookPagePermission,
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
export class FacebookPageAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookPageAccessService.name);
  private accessToken: string;
  private pageAccessTokens: Map<string, string> = new Map();

  constructor() {
  }

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Page access management');
    }

    this.accessToken = tokens.access_token;
  }

  async grantManagementAccess(pageId: string, agencyBusinessPortfolioId: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Page management access to business ${agencyBusinessPortfolioId} for page ${pageId}`);

    const result = await this.grantAgencyAccess({
      entityId: pageId,
      agencyIdentifier: agencyBusinessPortfolioId,
      permissions: [FacebookPagePermission.ADMIN]
    });

    return {
      ...result,
      service: FacebookServiceType.PAGE,
      accessType: 'manage' as TAccessType,
      entityId: pageId,
      agencyIdentifier: agencyBusinessPortfolioId
    };
  }

  async grantViewAccess(pageId: string, agencyBusinessPortfolioId: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Page view access to business ${agencyBusinessPortfolioId} for page ${pageId}`);

    const result = await this.grantAgencyAccess({
      entityId: pageId,
      agencyIdentifier: agencyBusinessPortfolioId,
      permissions: [FacebookPagePermission.ANALYST]
    });

    return {
      ...result,
      service: FacebookServiceType.PAGE,
      accessType: 'view' as TAccessType,
      entityId: pageId,
      agencyIdentifier: agencyBusinessPortfolioId
    };
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<TFacebookAccessResponse> {
    try {
      this.logger.log(`Attempting to grant Facebook Page access to business ${request.agencyIdentifier} for page ${request.entityId}`);

      if (!this.accessToken) {
        throw new Error('Access token must be set before granting access');
      }

      const pageAccessToken = await this.getPageAccessToken(request.entityId);
      if (!pageAccessToken) {
        this.logger.error(`Failed to get page access token for page ${request.entityId}`);
        return {
          success: false,
          service: FacebookServiceType.PAGE,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Unable to get page access token. Ensure you have admin access to this page.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/pages/${request.entityId}`
        };
      }

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyIdentifier);

      if (existingAccess) {
        this.logger.warn(`Business ${request.agencyIdentifier} already has access to page ${request.entityId}`);
        return {
          success: false,
          service: FacebookServiceType.PAGE,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Business already has access to this page',
          linkId: existingAccess.linkId
        };
      }

      const tasks = this.mapPermissionToTasks(request.permissions[0] || FacebookPagePermission.EDITOR);

      try {
        const { data: response } = await facebookHttpClient.post(
          `/${request.entityId}/agencies`,
          {
            business: request.agencyIdentifier,
            permitted_tasks: tasks
          },
          {
            params: {
              access_token: pageAccessToken
            }
          }
        );

        if (response.success !== false) {
          this.logger.log(`Successfully granted Facebook Page access to business ${request.agencyIdentifier} for page ${request.entityId}`);

          return {
            success: true,
            service: FacebookServiceType.PAGE,
            accessType: this.determineAccessType(request.permissions),
            entityId: request.entityId,
            agencyIdentifier: request.agencyIdentifier,
            linkId: `${request.entityId}_${request.agencyIdentifier}`,
            message: `Facebook Page access granted successfully to business ${request.agencyIdentifier}`
          };
        } else {
          throw new Error('Failed to add business as agency to page');
        }

      } catch (apiError: any) {
        this.logger.warn(`API method failed, may require manual page role assignment: ${apiError.message}`);
        console.error('API Error details:', apiError.response?.data);

        return {
          success: false,
          service: FacebookServiceType.PAGE,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Facebook Page access assignment requires manual intervention through Business Manager',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/pages/${request.entityId}`,
          message: `Please manually assign business ${request.agencyIdentifier} access through Facebook Business Manager at https://business.facebook.com/settings/pages/${request.entityId}`
        };
      }

    } catch (error: any) {
      this.logger.error(`Failed to grant Facebook Page access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
        return {
          success: false,
          service: FacebookServiceType.PAGE,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Access token is invalid or expired'
        };
      }

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          service: FacebookServiceType.PAGE,
          accessType: this.determineAccessType(request.permissions),
          entityId: request.entityId,
          agencyIdentifier: request.agencyIdentifier,
          error: 'Insufficient permissions to manage page access. You must be an admin of this page.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/pages/${request.entityId}`
        };
      }

      return {
        success: false,
        service: FacebookServiceType.PAGE,
        accessType: this.determineAccessType(request.permissions),
        entityId: request.entityId,
        agencyIdentifier: request.agencyIdentifier,
        error: `Failed to grant access: ${error.message}`,
        requiresManualApproval: true,
        businessManagerUrl: `https://business.facebook.com/settings/pages/${request.entityId}`
      };
    }
  }

  async checkExistingUserAccess(entityId: string, businessId: string): Promise<IBaseUserInfo | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const pageAccessToken = await this.getPageAccessToken(entityId);
      if (!pageAccessToken) {
        this.logger.warn(`Using user access token for checking existing access on page ${entityId}`);
      }

      const { data: response } = await facebookHttpClient.get(
        `/${entityId}/agencies`,
        {
          params: {
            access_token: pageAccessToken || this.accessToken
          }
        }
      );

      if (isNil(response.data)) {
        return null;
      }

      const existingAgency = response.data.find((agency: any) => {
        return agency.id === businessId;
      });

      if (!existingAgency) {
        return null;
      }

      const permission = this.mapTasksToPermission(existingAgency.permitted_tasks || []);

      return {
        linkId: existingAgency.id || `${entityId}_${businessId}`,
        email: businessId, // Using businessId as email for compatibility
        permissions: [permission],
        kind: 'facebook#pageAgency'
      };

    } catch (error: any) {
      this.logger.error(`Error checking existing Facebook Page agency access: ${error.message}`);
      console.error(error);
      return null;
    }
  }

  async getEntityUsers(entityId: string): Promise<IBaseUserInfo[]> {
    try {
      if (!this.accessToken) {
        return [];
      }

      const pageAccessToken = await this.getPageAccessToken(entityId);
      if (!pageAccessToken) {
        this.logger.warn(`Using user access token for fetching agencies on page ${entityId}`);
      }

      const { data: response } = await facebookHttpClient.get(
        `/${entityId}/agencies`,
        {
          params: {
            access_token: pageAccessToken || this.accessToken
          }
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((agency: any) => {
        const permission = this.mapTasksToPermission(agency.permitted_tasks || []);
        const businessId = agency.id;

        return {
          linkId: businessId || `${entityId}_${agency.name}`,
          email: businessId || '', // Using businessId as email for compatibility
          permissions: [permission],
          kind: 'facebook#pageAgency'
        };
      });

    } catch (error: any) {
      this.logger.error(`Error fetching Facebook Page agencies: ${error.message}`);
      console.error(error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      const pageAccessToken = await this.getPageAccessToken(entityId);
      if (!pageAccessToken) {
        return {
          success: false,
          service: FacebookServiceType.PAGE,
          error: 'Unable to get page access token. Ensure you have admin access to this page.'
        };
      }

      const businessId = linkId.includes('_') ? linkId.split('_')[0] : linkId;

      await facebookHttpClient.delete(
        `/${entityId}/agencies`,
        {
          params: {
            business: businessId,
            access_token: pageAccessToken
          }
        }
      );

      this.logger.log(`Successfully revoked Facebook Page access for business ${businessId} from page ${entityId}`);

      return {
        success: true,
        service: FacebookServiceType.PAGE,
        message: 'Facebook Page access revoked successfully'
      };

    } catch (error: any) {
      this.logger.error(`Failed to revoke Facebook Page access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          service: FacebookServiceType.PAGE,
          error: 'Insufficient permissions to remove page agencies. Manual removal may be required.'
        };
      }

      return {
        success: false,
        service: FacebookServiceType.PAGE,
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
    return [FACEBOOK_PAGES_SHOW_LIST_SCOPE, FACEBOOK_CATALOG_MANAGEMENT_SCOPE];
  }

  private mapPermissionToTasks(permission: string): string[] {
    const taskMap: Record<string, string[]> = {
      [FacebookPagePermission.ADMIN]: ['MANAGE', 'CREATE_CONTENT', 'MODERATE', 'ADVERTISE', 'ANALYZE'],
      [FacebookPagePermission.EDITOR]: ['CREATE_CONTENT', 'MODERATE', 'ADVERTISE'],
      [FacebookPagePermission.MODERATOR]: ['MODERATE', 'ADVERTISE'],
      [FacebookPagePermission.ADVERTISER]: ['ADVERTISE'],
      [FacebookPagePermission.ANALYST]: ['ANALYZE']
    };

    return taskMap[permission] || ['ADVERTISE', 'ANALYZE'];
  }

  private mapTasksToPermission(tasks: string[]): string {
    if (!tasks || tasks.length === 0) {
      return FacebookPagePermission.ANALYST;
    }

    if (tasks.includes('MANAGE')) {
      return FacebookPagePermission.ADMIN;
    }

    if (tasks.includes('CREATE_CONTENT') && tasks.includes('MODERATE')) {
      return FacebookPagePermission.EDITOR;
    }

    if (tasks.includes('MODERATE') && !tasks.includes('CREATE_CONTENT')) {
      return FacebookPagePermission.MODERATOR;
    }

    if (tasks.includes('ADVERTISE') && !tasks.includes('MODERATE')) {
      return FacebookPagePermission.ADVERTISER;
    }

    if (tasks.includes('ANALYZE')) {
      return FacebookPagePermission.ANALYST;
    }

    return FacebookPagePermission.ANALYST;
  }

  private async getPageAccessToken(pageId: string): Promise<string | null> {
    try {
      if (this.pageAccessTokens.has(pageId)) {
        return this.pageAccessTokens.get(pageId);
      }

      const { data: response } = await facebookHttpClient.get(
        `/${pageId}`,
        {
          params: {
            fields: 'access_token',
            access_token: this.accessToken
          }
        }
      );

      if (response.access_token) {
        this.pageAccessTokens.set(pageId, response.access_token);
        return response.access_token;
      }

      return null;
    } catch (error: any) {
      this.logger.error(`Failed to get page access token for page ${pageId}: ${error.message}`);
      console.error('Error details:', error.response?.data);
      return null;
    }
  }

  private determineAccessType(permissions: string[]): TAccessType {
    if (permissions.includes(FacebookPagePermission.ADMIN) || permissions.includes(FacebookPagePermission.EDITOR)) {
      return 'manage';
    }
    return 'view';
  }
}
