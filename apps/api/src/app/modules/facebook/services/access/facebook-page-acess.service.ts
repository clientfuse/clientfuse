import {
  FACEBOOK_CATALOG_MANAGEMENT_SCOPE,
  FACEBOOK_ERROR_CODES,
  FACEBOOK_PAGE_ROLES,
  FACEBOOK_PAGES_SHOW_LIST_SCOPE,
  FacebookPagePermission,
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
export class FacebookPageAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookPageAccessService.name);
  private accessToken: string;

  constructor(private readonly configService: ConfigService) {}

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Page access management');
    }

    this.accessToken = tokens.access_token;
  }

  async grantManagementAccess(pageId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Page management access to ${agencyEmail} for page ${pageId}`);

    return this.grantAgencyAccess({
      entityId: pageId,
      agencyEmail: agencyEmail,
      permissions: [FacebookPagePermission.ADMIN],
      roleType: FacebookPagePermission.ADMIN
    });
  }

  async grantViewAccess(pageId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Page view access to ${agencyEmail} for page ${pageId}`);

    return this.grantAgencyAccess({
      entityId: pageId,
      agencyEmail: agencyEmail,
      permissions: [FacebookPagePermission.ANALYST],
      roleType: FacebookPagePermission.ANALYST
    });
  }

  async grantAgencyAccess(request: TFacebookAccessRequest): Promise<TFacebookAccessResponse> {
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

      const role = this.mapPermissionToRole(request.permissions[0] || FacebookPagePermission.EDITOR);

      try {
        const { data: response } = await facebookHttpClient.post(
          `/${request.entityId}/roles`,
          {},
          {
            params: {
              user: request.agencyEmail,
              role: role,
              access_token: this.accessToken
            }
          }
        );

        if (response.success !== false) {
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

    } catch (error: any) {
      this.logger.error(`Failed to grant Facebook Page access: ${error.message}`);
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

  async checkExistingUserAccess(entityId: string, email: string): Promise<TFacebookUserInfo | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const { data: response } = await facebookHttpClient.get(
        `/${entityId}/roles`,
        {
          params: {
            fields: 'user,role',
            access_token: this.accessToken
          }
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
        permissions: [existingUser.role || FacebookPagePermission.EDITOR],
        kind: 'facebook#pageUser',
        status: 'ACTIVE',
        roleType: existingUser.role
      };

    } catch (error: any) {
      this.logger.error(`Error checking existing Facebook Page user access: ${error.message}`);
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
        `/${entityId}/roles`,
        {
          params: {
            fields: 'user,role',
            access_token: this.accessToken
          }
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((roleData: any) => ({
        linkId: roleData.user?.id || `${entityId}_${roleData.user?.email}`,
        email: roleData.user?.email || '',
        permissions: [roleData.role || FacebookPagePermission.EDITOR],
        kind: 'facebook#pageUser',
        status: 'ACTIVE',
        roleType: roleData.role
      }));

    } catch (error: any) {
      this.logger.error(`Error fetching Facebook Page entity users: ${error.message}`);
      console.error(error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<TFacebookAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      const userId = linkId.includes('_') ? linkId.split('_')[1] : linkId;

      await facebookHttpClient.delete(
        `/${entityId}/roles`,
        {
          params: {
            user: userId,
            access_token: this.accessToken
          }
        }
      );

      this.logger.log(`Successfully revoked Facebook Page access for user ${userId} from page ${entityId}`);

      return {
        success: true,
        message: 'Facebook Page access revoked successfully'
      };

    } catch (error: any) {
      this.logger.error(`Failed to revoke Facebook Page access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
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

  getRequiredScopes(): string[] {
    return [FACEBOOK_PAGES_SHOW_LIST_SCOPE, FACEBOOK_CATALOG_MANAGEMENT_SCOPE];
  }

  async getPageInfo(pageId: string): Promise<any> {
    try {
      const { data: response } = await facebookHttpClient.get(
        `/${pageId}`,
        {
          params: {
            fields: 'id,name,category,verification_status,fan_count,about,website',
            access_token: this.accessToken
          }
        }
      );

      return response;

    } catch (error: any) {
      this.logger.error(`Error fetching page info: ${error.message}`);
      console.error(error);
      return null;
    }
  }

  private mapPermissionToRole(permission: string): string {
    const roleMap: Record<string, string> = {
      [FacebookPagePermission.ADMIN]: FACEBOOK_PAGE_ROLES.ADMIN,
      [FacebookPagePermission.EDITOR]: FACEBOOK_PAGE_ROLES.EDITOR,
      [FacebookPagePermission.MODERATOR]: FACEBOOK_PAGE_ROLES.MODERATOR,
      [FacebookPagePermission.ADVERTISER]: FACEBOOK_PAGE_ROLES.ADVERTISER,
      [FacebookPagePermission.ANALYST]: FACEBOOK_PAGE_ROLES.ANALYST
    };

    return roleMap[permission] || FACEBOOK_PAGE_ROLES.EDITOR;
  }
}
