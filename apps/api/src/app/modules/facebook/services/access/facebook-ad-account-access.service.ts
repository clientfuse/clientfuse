import {
  FACEBOOK_AD_ACCOUNT_ROLES,
  FACEBOOK_ADS_MANAGEMENT_SCOPE,
  FACEBOOK_ERROR_CODES,
  FacebookAdAccountPermission,
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
export class FacebookAdAccountAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookAdAccountAccessService.name);
  private accessToken: string;

  constructor(private readonly configService: ConfigService) {}

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Ad Account access management');
    }

    this.accessToken = tokens.access_token;
  }

  async grantManagementAccess(adAccountId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Ad Account management access to ${agencyEmail} for account ${adAccountId}`);

    return this.grantAgencyAccess({
      entityId: adAccountId,
      agencyEmail: agencyEmail,
      permissions: [FacebookAdAccountPermission.ADMIN],
      roleType: FacebookAdAccountPermission.ADMIN
    });
  }

  async grantViewAccess(adAccountId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    this.logger.log(`Granting Facebook Ad Account view access to ${agencyEmail} for account ${adAccountId}`);

    return this.grantAgencyAccess({
      entityId: adAccountId,
      agencyEmail: agencyEmail,
      permissions: [FacebookAdAccountPermission.REPORTS_ONLY],
      roleType: FacebookAdAccountPermission.REPORTS_ONLY
    });
  }

  async grantAgencyAccess(request: TFacebookAccessRequest): Promise<TFacebookAccessResponse> {
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

      const role = this.mapPermissionToRole(request.permissions[0] || FacebookAdAccountPermission.GENERAL_USER);

      const { data: response } = await facebookHttpClient.post(
        `/${accountId}/assigned_users`,
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

    } catch (error: any) {
      this.logger.error(`Failed to grant Facebook Ad Account access: ${error.message}`);
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
          error: 'Insufficient permissions to manage ad account users. You must be an admin of this ad account.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/ad-accounts/${request.entityId.replace('act_', '')}/people`
        };
      }

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.USER_NOT_FOUND) {
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

  async checkExistingUserAccess(entityId: string, email: string): Promise<TFacebookUserInfo | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const cleanAccountId = entityId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      const { data: response } = await facebookHttpClient.get(
        `/${accountId}/assigned_users`,
        {
          params: {
            fields: 'id,name,email,role,permissions',
            access_token: this.accessToken
          }
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
        permissions: existingUser.permissions || [existingUser.role || FacebookAdAccountPermission.GENERAL_USER],
        kind: 'facebook#adAccountUser',
        status: 'ACTIVE',
        roleType: existingUser.role
      };

    } catch (error: any) {
      this.logger.error(`Error checking existing Facebook Ad Account user access: ${error.message}`);
      console.error(error);
      return null;
    }
  }

  async getEntityUsers(entityId: string): Promise<TFacebookUserInfo[]> {
    try {
      if (!this.accessToken) {
        return [];
      }

      const cleanAccountId = entityId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      const { data: response } = await facebookHttpClient.get(
        `/${accountId}/assigned_users`,
        {
          params: {
            fields: 'id,name,email,role,permissions',
            access_token: this.accessToken
          }
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((user: any) => ({
        linkId: user.id || `${accountId}_${user.email}`,
        email: user.email || '',
        permissions: user.permissions || [user.role || FacebookAdAccountPermission.GENERAL_USER],
        kind: 'facebook#adAccountUser',
        status: 'ACTIVE',
        roleType: user.role
      }));

    } catch (error: any) {
      this.logger.error(`Error fetching Facebook Ad Account entity users: ${error.message}`);
      console.error(error);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<TFacebookAccessResponse> {
    try {
      if (!this.accessToken) {
        throw new Error('Access token must be set before revoking access');
      }

      const cleanAccountId = entityId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      const userId = linkId.includes('_') ? linkId.split('_')[1] : linkId;

      await facebookHttpClient.delete(
        `/${accountId}/assigned_users`,
        {
          params: {
            user: userId,
            access_token: this.accessToken
          }
        }
      );

      this.logger.log(`Successfully revoked Facebook Ad Account access for user ${userId} from account ${accountId}`);

      return {
        success: true,
        message: 'Facebook Ad Account access revoked successfully'
      };

    } catch (error: any) {
      this.logger.error(`Failed to revoke Facebook Ad Account access: ${error.message}`);
      console.error(error);

      if (error.response?.data?.error?.code === FACEBOOK_ERROR_CODES.PERMISSIONS_ERROR) {
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

  getRequiredScopes(): string[] {
    return [FACEBOOK_ADS_MANAGEMENT_SCOPE];
  }

  async getAdAccountInfo(adAccountId: string): Promise<any> {
    try {
      const cleanAccountId = adAccountId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      const { data: response } = await facebookHttpClient.get(
        `/${accountId}`,
        {
          params: {
            fields: 'id,name,account_id,currency,timezone_name,account_status,business',
            access_token: this.accessToken
          }
        }
      );

      return response;

    } catch (error: any) {
      this.logger.error(`Error fetching ad account info: ${error.message}`);
      console.error(error);
      return null;
    }
  }

  private mapPermissionToRole(permission: string): string {
    const roleMap: Record<string, string> = {
      [FacebookAdAccountPermission.ADMIN]: FACEBOOK_AD_ACCOUNT_ROLES.ADMIN,
      [FacebookAdAccountPermission.GENERAL_USER]: FACEBOOK_AD_ACCOUNT_ROLES.GENERAL_USER,
      [FacebookAdAccountPermission.REPORTS_ONLY]: FACEBOOK_AD_ACCOUNT_ROLES.REPORTS_ONLY
    };

    return roleMap[permission] || FACEBOOK_AD_ACCOUNT_ROLES.GENERAL_USER;
  }
}
