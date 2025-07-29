import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FacebookAdsApi } from 'facebook-nodejs-business-sdk';
import { isEmpty, isNil } from 'lodash';
import {
  FACEBOOK_ERROR_CODES,
  FACEBOOK_PAGE_ROLES,
  FACEBOOK_SCOPES,
  IFacebookAccessRequest,
  IFacebookAccessResponse,
  IFacebookBaseAccessService,
  IFacebookCustomAccessOptions,
  IFacebookUserInfo
} from '../../models/facebook.model';

@Injectable()
export class FacebookPageAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookPageAccessService.name);
  private facebookApi: FacebookAdsApi;
  private accessToken: string;

  constructor(private readonly configService: ConfigService) {
  }

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Page access management');
    }

    this.accessToken = tokens.access_token;
    this.facebookApi = FacebookAdsApi.init(this.accessToken);
  }

  async grantManagementAccess(pageId: string, agencyEmail: string): Promise<IFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Page management access to ${agencyEmail} for page ${pageId}`);

    return this.grantAgencyAccess({
      entityId: pageId,
      agencyEmail: agencyEmail,
      permissions: ['ADMIN'],
      roleType: 'ADMIN'
    });
  }

  async grantReadOnlyAccess(pageId: string, agencyEmail: string): Promise<IFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Page read-only access to ${agencyEmail} for page ${pageId}`);

    return this.grantAgencyAccess({
      entityId: pageId,
      agencyEmail: agencyEmail,
      permissions: ['ANALYST'],
      roleType: 'ANALYST'
    });
  }

  async grantCustomAccess(options: IFacebookCustomAccessOptions): Promise<IFacebookAccessResponse> {
    try {
      this.logger.log(`Granting Facebook Page custom access to ${options.agencyEmail} for page ${options.entityId}`);

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
      this.logger.error(`Failed to grant Facebook Page custom access: ${error.message}`, error);
      return {
        success: false,
        error: `Failed to grant custom access: ${error.message}`
      };
    }
  }

  async grantAgencyAccess(request: IFacebookAccessRequest): Promise<IFacebookAccessResponse> {
    try {
      this.logger.log(`Attempting to grant Facebook Page access to ${request.agencyEmail} for page ${request.entityId}`);

      if (!this.accessToken) {
        throw new Error('Access token must be set before granting access');
      }

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyEmail);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyEmail} already has access to page ${request.entityId}`);
        return {
          success: false,
          error: 'User already has access to this page',
          linkId: existingAccess.linkId
        };
      }

      const role = this.mapPermissionToRole(request.permissions[0] || 'EDITOR');

      try {
        const response = await this.facebookApi.call<any>(
          'POST',
          `/${request.entityId}/roles`,
          {
            user: request.agencyEmail, // Use email or user ID
            role: role
          }
        );

        if (response.success) {
          this.logger.log(`Successfully granted Facebook Page access to ${request.agencyEmail} for page ${request.entityId}`);

          return {
            success: true,
            linkId: `${request.entityId}_${request.agencyEmail}`,
            entityId: request.entityId,
            message: `Facebook Page access granted successfully to ${request.agencyEmail}`
          };
        } else {
          throw new Error('Failed to add user to page roles');
        }

      } catch (apiError) {
        this.logger.warn(`API method failed, may require manual page role assignment: ${apiError.message}`);

        return {
          success: false,
          error: 'Facebook Page role assignment requires manual intervention through Page settings',
          requiresManualApproval: true,
          businessManagerUrl: `https://www.facebook.com/${request.entityId}/settings/?tab=page_roles`,
          message: `Please manually assign ${request.agencyEmail} the role of ${role} through Facebook Page settings at https://www.facebook.com/${request.entityId}/settings/?tab=page_roles`
        };
      }

    } catch (error) {
      this.logger.error(`Failed to grant Facebook Page access: ${error.message}`, error);

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
        return {
          success: false,
          error: 'Access token is invalid or expired'
        };
      }

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          error: 'Insufficient permissions to manage page roles. You must be an admin of this page.',
          requiresManualApproval: true,
          businessManagerUrl: `https://www.facebook.com/${request.entityId}/settings/?tab=page_roles`
        };
      }

      return {
        success: false,
        error: `Failed to grant access: ${error.message}`,
        requiresManualApproval: true,
        businessManagerUrl: `https://www.facebook.com/${request.entityId}/settings/?tab=page_roles`
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
        `/${entityId}/roles`,
        {
          fields: 'user,role'
        }
      );

      if (isNil(response.data)) {
        return null;
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = response.data.find((roleData: any) => {
        const user = roleData.user;
        return user?.email?.toLowerCase() === normalizedEmail ||
          user?.name?.toLowerCase().includes(normalizedEmail);
      });

      if (!existingUser) {
        return null;
      }

      return {
        linkId: existingUser.user?.id || `${entityId}_${email}`,
        email: existingUser.user?.email || email,
        permissions: [existingUser.role || 'EDITOR'],
        kind: 'facebook#pageUser',
        status: 'ACTIVE',
        roleType: existingUser.role
      };

    } catch (error) {
      this.logger.error(`Error checking existing Facebook Page user access: ${error.message}`, error);
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
        `/${entityId}/roles`,
        {
          fields: 'user,role'
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((roleData: any) => ({
        linkId: roleData.user?.id || `${entityId}_${roleData.user?.email}`,
        email: roleData.user?.email || '',
        permissions: [roleData.role || 'EDITOR'],
        kind: 'facebook#pageUser',
        status: 'ACTIVE',
        roleType: roleData.role
      }));

    } catch (error) {
      this.logger.error(`Error fetching Facebook Page entity users: ${error.message}`, error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IFacebookAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      const userId = linkId.includes('_') ? linkId.split('_')[1] : linkId;

      await this.facebookApi.call<any>(
        'DELETE',
        `/${entityId}/roles`,
        {
          user: userId
        }
      );

      this.logger.log(`Successfully revoked Facebook Page access for user ${userId} from page ${entityId}`);

      return {
        success: true,
        message: 'Facebook Page access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke Facebook Page access: ${error.message}`, error);

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          error: 'Insufficient permissions to remove page users. Manual removal may be required.',
          requiresManualApproval: true,
          businessManagerUrl: `https://www.facebook.com/${entityId}/settings/?tab=page_roles`
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
    return ['EDITOR'];
  }

  getAllAvailablePermissions(): string[] {
    return Object.values(FACEBOOK_PAGE_ROLES);
  }

  getRequiredScopes(): string[] {
    return [FACEBOOK_SCOPES.PAGES_SHOW_LIST, FACEBOOK_SCOPES.PAGES_MANAGE_METADATA];
  }

  async getPageInfo(pageId: string): Promise<any> {
    try {
      const response = await this.facebookApi.call<any>(
        'GET',
        `/${pageId}`,
        {
          fields: 'id,name,category,verification_status,fan_count,about,website'
        }
      );

      return response;

    } catch (error) {
      this.logger.error(`Error fetching page info: ${error.message}`, error);
      return null;
    }
  }

  private mapPermissionToRole(permission: string): string {
    const roleMap: Record<string, string> = {
      'ADMIN': FACEBOOK_PAGE_ROLES.ADMIN,
      'EDITOR': FACEBOOK_PAGE_ROLES.EDITOR,
      'MODERATOR': FACEBOOK_PAGE_ROLES.MODERATOR,
      'ADVERTISER': FACEBOOK_PAGE_ROLES.ADVERTISER,
      'ANALYST': FACEBOOK_PAGE_ROLES.ANALYST,
      'MANAGER': FACEBOOK_PAGE_ROLES.ADMIN,
      'READ_ONLY': FACEBOOK_PAGE_ROLES.ANALYST,
      'CONTENT_CREATOR': FACEBOOK_PAGE_ROLES.EDITOR
    };

    return roleMap[permission] || FACEBOOK_PAGE_ROLES.EDITOR;
  }
}
