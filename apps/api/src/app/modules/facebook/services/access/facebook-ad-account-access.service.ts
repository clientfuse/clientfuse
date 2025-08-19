import {
  FACEBOOK_AD_ACCOUNT_ROLES, FACEBOOK_ADS_MANAGEMENT_SCOPE,
  FACEBOOK_ERROR_CODES,
  FACEBOOK_SCOPES,
  FacebookAdAccountPermission,
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
export class FacebookAdAccountAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookAdAccountAccessService.name);
  private facebookApi: FacebookAdsApi;
  private accessToken: string;

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Ad Account access management');
    }

    this.accessToken = tokens.access_token;
    this.facebookApi = FacebookAdsApi.init(this.accessToken);
  }

  async grantManagementAccess(adAccountId: string, agencyEmail: string): Promise<IFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Ad Account management access to ${agencyEmail} for account ${adAccountId}`);

    return this.grantAgencyAccess({
      entityId: adAccountId,
      agencyEmail: agencyEmail,
      permissions: ['ADMIN'],
      roleType: 'ADMIN'
    });
  }

  async grantReadOnlyAccess(adAccountId: string, agencyEmail: string): Promise<IFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Ad Account read-only access to ${agencyEmail} for account ${adAccountId}`);

    return this.grantAgencyAccess({
      entityId: adAccountId,
      agencyEmail: agencyEmail,
      permissions: ['REPORTS_ONLY'],
      roleType: 'REPORTS_ONLY'
    });
  }

  async grantCustomAccess(options: IFacebookCustomAccessOptions): Promise<IFacebookAccessResponse> {
    try {
      this.logger.log(`Granting Facebook Ad Account custom access to ${options.agencyEmail} for account ${options.entityId}`);

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
      this.logger.error(`Failed to grant Facebook Ad Account custom access: ${error.message}`, error);
      return {
        success: false,
        error: `Failed to grant custom access: ${error.message}`
      };
    }
  }

  async grantAgencyAccess(request: IFacebookAccessRequest): Promise<IFacebookAccessResponse> {
    try {
      this.logger.log(`Attempting to grant Facebook Ad Account access to ${request.agencyEmail} for account ${request.entityId}`);

      if (!this.accessToken) {
        throw new Error('Access token must be set before granting access');
      }

      const existingAccess = await this.checkExistingUserAccess(request.entityId, request.agencyEmail);

      if (existingAccess) {
        this.logger.warn(`User ${request.agencyEmail} already has access to ad account ${request.entityId}`);
        return {
          success: false,
          error: 'User already has access to this ad account',
          linkId: existingAccess.linkId
        };
      }

      const cleanAccountId = request.entityId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      const role = this.mapPermissionToRole(request.permissions[0] || 'GENERAL_USER');

      const response = await this.facebookApi.call<any>(
        'POST',
        `/${accountId}/users`,
        {
          uid: request.agencyEmail, // Use email as identifier
          role: role
        }
      );

      if (response.success) {
        this.logger.log(`Successfully granted Facebook Ad Account access to ${request.agencyEmail} for account ${accountId}`);

        return {
          success: true,
          linkId: `${accountId}_${request.agencyEmail}`,
          entityId: request.entityId,
          message: `Facebook Ad Account access granted successfully to ${request.agencyEmail}`
        };
      } else {
        throw new Error('Failed to add user to ad account');
      }

    } catch (error) {
      this.logger.error(`Failed to grant Facebook Ad Account access: ${error.message}`, error);

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
        return {
          success: false,
          error: 'Access token is invalid or expired'
        };
      }

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          error: 'Insufficient permissions to manage ad account users. You must be an admin of this ad account.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/ad-accounts/${request.entityId.replace('act_', '')}/people`
        };
      }

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.USER_NOT_FOUND) {
        return {
          success: false,
          error: 'User not found. The user must have a Facebook account.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/ad-accounts/${request.entityId.replace('act_', '')}/people`
        };
      }

      return {
        success: false,
        error: `Failed to grant access: ${error.message}`,
        requiresManualApproval: true,
        businessManagerUrl: `https://business.facebook.com/settings/ad-accounts/${request.entityId.replace('act_', '')}/people`
      };
    }
  }

  async checkExistingUserAccess(entityId: string, email: string): Promise<IFacebookUserInfo | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const cleanAccountId = entityId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      const response = await this.facebookApi.call<any>(
        'GET',
        `/${accountId}/users`,
        {
          fields: 'id,name,email,role,permissions'
        }
      );

      if (isNil(response.data)) {
        return null;
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = response.data.find((user: any) =>
        user.email?.toLowerCase() === normalizedEmail
      );

      if (!existingUser) {
        return null;
      }

      return {
        linkId: existingUser.id || `${accountId}_${existingUser.email}`,
        email: existingUser.email || email,
        permissions: existingUser.permissions || [existingUser.role || 'GENERAL_USER'],
        kind: 'facebook#adAccountUser',
        status: 'ACTIVE',
        roleType: existingUser.role
      };

    } catch (error) {
      this.logger.error(`Error checking existing Facebook Ad Account user access: ${error.message}`, error);
      return null;
    }
  }

  async getEntityUsers(entityId: string): Promise<IFacebookUserInfo[]> {
    try {
      if (!this.accessToken) {
        return [];
      }

      const cleanAccountId = entityId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      const response = await this.facebookApi.call<any>(
        'GET',
        `/${accountId}/users`,
        {
          fields: 'id,name,email,role,permissions'
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((user: any) => ({
        linkId: user.id || `${accountId}_${user.email}`,
        email: user.email || '',
        permissions: user.permissions || [user.role || 'GENERAL_USER'],
        kind: 'facebook#adAccountUser',
        status: 'ACTIVE',
        roleType: user.role
      }));

    } catch (error) {
      this.logger.error(`Error fetching Facebook Ad Account entity users: ${error.message}`, error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IFacebookAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      const cleanAccountId = entityId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      const userId = linkId.includes('_') ? linkId.split('_')[1] : linkId;

      await this.facebookApi.call(
        'DELETE',
        `/${accountId}/users`,
        {
          uid: userId
        }
      );

      this.logger.log(`Successfully revoked Facebook Ad Account access for user ${userId} from account ${accountId}`);

      return {
        success: true,
        message: 'Facebook Ad Account access revoked successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to revoke Facebook Ad Account access: ${error.message}`, error);

      if (error.response?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
        return {
          success: false,
          error: 'Insufficient permissions to remove ad account users'
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

  getDefaultAgencyPermissions(): FacebookAdAccountPermission[] {
    return ['GENERAL_USER'];
  }

  getAllAvailablePermissions(): string[] {
    return Object.values(FACEBOOK_AD_ACCOUNT_ROLES);
  }

  getRequiredScopes(): string[] {
    return [FACEBOOK_ADS_MANAGEMENT_SCOPE];
  }

  async getAdAccountInfo(adAccountId: string): Promise<any> {
    try {
      const cleanAccountId = adAccountId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      const response = await this.facebookApi.call(
        'GET',
        `/${accountId}`,
        {
          fields: 'id,name,account_id,currency,timezone_name,account_status,business'
        }
      );

      return response;

    } catch (error) {
      this.logger.error(`Error fetching ad account info: ${error.message}`, error);
      return null;
    }
  }

  private mapPermissionToRole(permission: string): string {
    const roleMap: Record<string, string> = {
      'ADMIN': FACEBOOK_AD_ACCOUNT_ROLES.ADMIN,
      'GENERAL_USER': FACEBOOK_AD_ACCOUNT_ROLES.GENERAL_USER,
      'REPORTS_ONLY': FACEBOOK_AD_ACCOUNT_ROLES.REPORTS_ONLY,
      'MANAGER': FACEBOOK_AD_ACCOUNT_ROLES.ADMIN,
      'READ_ONLY': FACEBOOK_AD_ACCOUNT_ROLES.REPORTS_ONLY,
      'EDIT': FACEBOOK_AD_ACCOUNT_ROLES.GENERAL_USER
    };

    return roleMap[permission] || FACEBOOK_AD_ACCOUNT_ROLES.GENERAL_USER;
  }
}
