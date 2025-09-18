import {
  FACEBOOK_AD_ACCOUNT_ROLES,
  FACEBOOK_ADS_MANAGEMENT_SCOPE,
  FACEBOOK_ERROR_CODES,
  FacebookAdAccountPermission,
  IBaseAccessRequest,
  IFacebookBaseAccessService,
  TFacebookAccessResponse,
  TFacebookUserInfo
} from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { isEmpty, isNil } from 'lodash';
import { facebookHttpClient } from '../../../../core/utils/http';


@Injectable()
export class FacebookAdAccountAccessService implements IFacebookBaseAccessService {
  private readonly logger = new Logger(FacebookAdAccountAccessService.name);
  private accessToken: string;

  constructor() {
  }

  setCredentials(tokens: { access_token: string }): void {
    if (isEmpty(tokens) || isNil(tokens) || !tokens.access_token) {
      throw new Error('Access token is required for Facebook Ad Account access management');
    }

    this.accessToken = tokens.access_token;
  }

  async grantManagementAccess(adAccountId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    const businessId = agencyEmail; // This actually contains the business ID
    this.logger.log(`Granting Facebook Ad Account management access to business ${businessId} for account ${adAccountId}`);

    return this.grantAgencyAccess({
      entityId: adAccountId,
      agencyEmail: businessId, // Passing business ID
      permissions: [FacebookAdAccountPermission.ADMIN]
    });
  }

  async grantViewAccess(adAccountId: string, agencyEmail: string): Promise<TFacebookAccessResponse> {
    const businessId = agencyEmail; // This actually contains the business ID
    this.logger.log(`Granting Facebook Ad Account view access to business ${businessId} for account ${adAccountId}`);

    return this.grantAgencyAccess({
      entityId: adAccountId,
      agencyEmail: businessId, // Passing business ID
      permissions: [FacebookAdAccountPermission.REPORTS_ONLY]
    });
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<TFacebookAccessResponse> {
    try {
      const businessId = request.agencyEmail; // This actually contains the business ID
      this.logger.log(`Attempting to grant Facebook Ad Account access to business ${businessId} for account ${request.entityId}`);

      if (!this.accessToken) {
        throw new Error('Access token must be set before granting access');
      }

      const existingAccess = await this.checkExistingUserAccess(request.entityId, businessId);

      if (existingAccess) {
        this.logger.warn(`Business ${businessId} already has access to ad account ${request.entityId}`);
        return {
          success: false,
          error: 'Business already has access to this ad account',
          linkId: existingAccess.linkId
        };
      }

      const cleanAccountId = request.entityId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      const businessScopedUserId = await this.getBusinessScopedUserId(businessId);

      if (!businessScopedUserId) {
        this.logger.error(`Could not retrieve business-scoped user ID for business ${businessId}`);
        return {
          success: false,
          error: 'Unable to get business user ID. Please ensure the business has users assigned.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/ad-accounts/${cleanAccountId}`,
          message: `Please manually assign business ${businessId} access through Facebook Business Manager`
        };
      }

      const role = this.mapPermissionToRole(request.permissions[0] || FacebookAdAccountPermission.GENERAL_USER);

      try {
        const response = await facebookHttpClient.post(
          `/${accountId}/assigned_users`,
          {},
          {
            params: {
              user: businessScopedUserId,
              role: role,
              business: businessId, // Include business parameter
              access_token: this.accessToken
            }
          }
        );

        if (response.data?.success !== false) {
          this.logger.log(`Successfully granted Facebook Ad Account access to business ${businessId} (user: ${businessScopedUserId}) for account ${accountId}`);

          return {
            success: true,
            linkId: `${accountId}_${businessId}`,
            entityId: request.entityId,
            message: `Facebook Ad Account access granted successfully to business ${businessId}`
          };
        } else {
          throw new Error('Failed to add business user to ad account');
        }

      } catch (apiError: any) {
        this.logger.error(`Failed to assign user via assigned_users endpoint: ${apiError.message}`);
        console.error('API Error details:', apiError.response?.data);

        return {
          success: false,
          error: 'Unable to grant access via API. Manual intervention required.',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/ad-accounts/${cleanAccountId}`,
          message: `Please manually assign business ${businessId} access through Facebook Business Manager`
        };
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
          error: 'Business user not found. Please ensure the business has valid users.',
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

  async checkExistingUserAccess(entityId: string, businessId: string): Promise<TFacebookUserInfo | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const cleanAccountId = entityId.replace('act_', '');
      const accountId = `act_${cleanAccountId}`;

      // First, check in agencies (business partners)
      try {
        const { data: agenciesResponse } = await facebookHttpClient.get(
          `/${accountId}/agencies`,
          {
            params: {
              fields: 'id,name,role',
              access_token: this.accessToken
            }
          }
        );

        if (agenciesResponse?.data) {
          const agency = agenciesResponse.data.find((a: any) => a.id === businessId);
          if (agency) {
            this.logger.log(`Found business partner ${businessId} in agencies list for account ${accountId}`);
            return {
              linkId: agency.id,
              email: businessId, // Using businessId for compatibility
              permissions: [agency.role || FacebookAdAccountPermission.GENERAL_USER],
              kind: 'facebook#adAccountAgency',
              status: 'ACTIVE',
              roleType: agency.role || FacebookAdAccountPermission.GENERAL_USER
            };
          }
        }
      } catch (agenciesError: any) {
        this.logger.warn(`Error checking agencies for account ${accountId}: ${agenciesError.message}`);
      }

      try {
        const businessScopedUserId = await this.getBusinessScopedUserId(businessId);

        const { data: response } = await facebookHttpClient.get(
          `/${accountId}/assigned_users`,
          {
            params: {
              fields: 'id,name,tasks,permitted_tasks',
              business: businessId, // Include business parameter for business-scoped users
              access_token: this.accessToken
            }
          }
        );

        if (response?.data) {
          const existingUser = response.data.find((user: any) => {
            // Check against business-scoped user ID or business ID
            return user.id === businessScopedUserId ||
              user.id === businessId ||
              user.business?.id === businessId;
          });

          if (existingUser) {
            const roleType = this.mapTasksToRole(existingUser.tasks);

            return {
              linkId: existingUser.id || `${accountId}_${businessId}`,
              email: businessId, // Using businessId for compatibility
              permissions: existingUser.tasks || [FacebookAdAccountPermission.GENERAL_USER],
              kind: 'facebook#adAccountUser',
              status: 'ACTIVE',
              roleType: roleType
            };
          }
        }
      } catch (usersError: any) {
        this.logger.warn(`Error checking assigned users for account ${accountId}: ${usersError.message}`);
      }

      return null;

    } catch (error: any) {
      this.logger.error(`Error checking existing Facebook Ad Account access: ${error.message}`);
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
      const users: TFacebookUserInfo[] = [];

      const adAccountInfo = await this.getAdAccountInfo(entityId);

      if (!adAccountInfo?.business?.id) {
        this.logger.warn(`Ad account ${accountId} does not have an associated business`);
        return [];
      }

      const businessId = adAccountInfo.business.id;

      try {
        const { data: usersResponse } = await facebookHttpClient.get(
          `/${accountId}/assigned_users`,
          {
            params: {
              fields: 'id,name,tasks,permitted_tasks,business',
              business: businessId,
              access_token: this.accessToken
            }
          }
        );

        if (usersResponse?.data) {
          usersResponse.data.forEach((user: any) => {
            const identifier = user.business?.id || user.id || '';
            const roleType = this.mapTasksToRole(user.tasks);

            users.push({
              linkId: user.id || `${accountId}_${identifier}`,
              email: identifier,
              permissions: user.tasks || [FacebookAdAccountPermission.GENERAL_USER],
              kind: 'facebook#adAccountUser',
              status: 'ACTIVE',
              roleType: roleType
            });
          });
        }
      } catch (usersError: any) {
        this.logger.warn(`Error fetching assigned users for account ${accountId}: ${usersError.message}`);
      }

      try {
        const { data: agenciesResponse } = await facebookHttpClient.get(
          `/${accountId}/agencies`,
          {
            params: {
              fields: 'id,name,role',
              access_token: this.accessToken
            }
          }
        );

        if (agenciesResponse?.data) {
          agenciesResponse.data.forEach((agency: any) => {
            const roleType = agency.role || FacebookAdAccountPermission.GENERAL_USER;

            users.push({
              linkId: agency.id,
              email: agency.id, // Using business ID as identifier
              permissions: [roleType],
              kind: 'facebook#adAccountAgency',
              status: 'ACTIVE',
              roleType: roleType
            });
          });
        }
      } catch (agenciesError: any) {
        this.logger.warn(`Error fetching agencies for account ${accountId}: ${agenciesError.message}`);
      }

      return users;

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
          error: 'Insufficient permissions to remove ad account users',
          requiresManualApproval: true,
          businessManagerUrl: `https://business.facebook.com/settings/ad-accounts/${entityId.replace('act_', '')}`
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

  private async getBusinessScopedUserId(businessId: string): Promise<string | null> {
    try {
      const { data: response } = await facebookHttpClient.get(
        `/${businessId}/business_users`,
        {
          params: {
            access_token: this.accessToken
          }
        }
      );

      if (!response.data || response.data.length === 0) {
        this.logger.warn(`No business users found for business ${businessId}`);
        return null;
      }

      const businessUserId = response.data[0].id;
      this.logger.log(`Found business-scoped user ID: ${businessUserId} for business ${businessId}`);
      return businessUserId;

    } catch (error: any) {
      this.logger.error(`Failed to get business-scoped user ID for business ${businessId}: ${error.message}`);
      console.error('Error details:', error.response?.data);
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

  private mapTasksToRole(tasks: string[] | undefined): string {
    if (!tasks || tasks.length === 0) {
      return FacebookAdAccountPermission.GENERAL_USER;
    }

    if (tasks.includes('MANAGE')) {
      return FacebookAdAccountPermission.ADMIN;
    }

    if (tasks.includes('ADVERTISE') || tasks.includes('DRAFT')) {
      return FacebookAdAccountPermission.GENERAL_USER;
    }

    if (tasks.includes('ANALYZE')) {
      return FacebookAdAccountPermission.REPORTS_ONLY;
    }

    return FacebookAdAccountPermission.GENERAL_USER;
  }
}
