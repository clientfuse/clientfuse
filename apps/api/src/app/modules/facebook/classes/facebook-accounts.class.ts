import {
  FacebookAdAccount,
  FacebookBusinessAccount,
  FacebookBusinessRole,
  FacebookCatalog,
  FacebookCatalogRole,
  FacebookCredentials,
  FacebookPage,
  FacebookPixel,
  FacebookTask
} from '@clientfuse/models';
import { Logger } from '@nestjs/common';
import { isNil } from 'lodash';
import { facebookHttpClient } from '../../../core/utils/http';

export class FacebookAccounts {
  private readonly logger = new Logger(FacebookAccounts.name);
  private readonly accessToken: string;
  private userId: string | null = null;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  getCredentials(): FacebookCredentials {
    return {
      access_token: this.accessToken
    };
  }

  async getUserInfo(): Promise<{ email: string; id: string }> {
    try {
      const { data } = await facebookHttpClient.get('/me', {
        params: {
          access_token: this.accessToken,
          fields: 'id,email'
        }
      });

      if (data?.id) {
        this.userId = data.id;
      }

      return data;
    } catch (error: any) {
      this.logger.error('Error fetching user info:', error?.response?.data || error);
      throw error;
    }
  }

  async getGrantedScopes(): Promise<string[]> {
    try {
      this.logger.log('Fetching granted Facebook permissions (Graph API)');
      const { data } = await facebookHttpClient.get('/me/permissions', {
        params: { access_token: this.accessToken }
      });

      return (data?.data ?? [])
        .filter((p: any) => p.status === 'granted')
        .map((p: any) => p.permission);
    } catch (error: any) {
      this.logger.error('Error fetching Facebook permissions:', error?.response?.data || error);
      return [];
    }
  }

  async getAdAccounts(): Promise<FacebookAdAccount[]> {
    try {
      this.logger.log('Fetching Facebook Ad Accounts');

      const { data } = await facebookHttpClient.get('/me/adaccounts', {
        params: {
          access_token: this.accessToken,
          fields: [
            'id',
            'name',
            'account_id',
            'business',
            'currency',
            'timezone_name',
            'account_status',
            'created_time',
            'user_tasks'
          ].join(',')
        }
      });

      if (isNil(data?.data)) {
        return [];
      }

      const adminAccounts = data.data.filter((account: any) => {
        const tasks = account.user_tasks || [];
        return tasks.includes(FacebookTask.MANAGE) || true;
      });

      return adminAccounts.map((account: any) => ({
        id: account.id,
        name: account.name || `Ad Account ${account.account_id}`,
        account_id: account.account_id,
        business_id: account.business?.id,
        business_name: account.business?.name,
        currency: account.currency,
        timezone_name: account.timezone_name,
        account_status: account.account_status,
        created_time: account.created_time
      }));

    } catch (error: any) {
      this.logger.error('Error fetching Facebook Ad Accounts:', error?.response?.data || error);

      if (error?.response?.data?.error?.code === 190) {
        this.logger.error('Access token is invalid or expired');
      }

      return [];
    }
  }

  async getBusinessAccounts(): Promise<FacebookBusinessAccount[]> {
    try {
      this.logger.log('Fetching Facebook Business Accounts');

      const { data } = await facebookHttpClient.get('/me/businesses', {
        params: {
          access_token: this.accessToken,
          fields: [
            'id',
            'name',
            'verification_status',
            'created_time',
            'updated_time',
            'business_type',
            'primary_page'
          ].join(',')
        }
      });

      if (isNil(data?.data)) {
        return [];
      }

      const adminBusinesses = [];

      for (const business of data.data) {
        try {
          const { data: usersData } = await facebookHttpClient.get(
            `/${business.id}/business_users`,
            { params: { access_token: this.accessToken, fields: 'email,role' } }
          );

          if (usersData?.data) {
            const isAdmin = usersData.data.some((user: any) => user.role === FacebookBusinessRole.ADMIN);

            if (isAdmin) {
              adminBusinesses.push({
                id: business.id,
                name: business.name,
                verification_status: business.verification_status,
                created_time: business.created_time,
                updated_time: business.updated_time,
                business_type: business.business_type,
                primary_page: business.primary_page
              });
            }
          }
        } catch (userError: any) {
          this.logger.warn(`Could not fetch users for business ${business.id}:`, userError?.response?.data || userError);
        }
      }

      return adminBusinesses;
    } catch (error: any) {
      this.logger.error('Error fetching Facebook Business Accounts:', error?.response?.data || error);
      return [];
    }
  }

  async getPages(): Promise<FacebookPage[]> {
    try {
      this.logger.log('Fetching Facebook Pages');

      const { data } = await facebookHttpClient.get('/me/accounts', {
        params: {
          access_token: this.accessToken,
          fields: [
            'id',
            'name',
            'category',
            'category_list',
            'access_token',
            'tasks',
            'verification_status',
            'fan_count'
          ].join(',')
        }
      });

      if (isNil(data?.data)) {
        return [];
      }

      const adminPages = data.data.filter((page) => {
        const tasks = page.tasks || [];
        return tasks.includes(FacebookTask.MANAGE);
      });

      return adminPages.map((page) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        category_list: page.category_list || [],
        access_token: page.access_token,
        perms: [],
        tasks: page.tasks || [],
        verification_status: page.verification_status,
        fan_count: page.fan_count
      }));

    } catch (error) {
      this.logger.error('Error fetching Facebook Pages:', error?.response?.data || error);
      return [];
    }
  }

  async getPixels(): Promise<FacebookPixel[]> {
    try {
      this.logger.log('Fetching Facebook Pixels');

      const businessAccounts = await this.getBusinessAccounts();

      if (businessAccounts.length === 0) {
        return [];
      }

      const allPixels: FacebookPixel[] = [];

      for (const business of businessAccounts) {
        try {
          const { data } = await facebookHttpClient.get(`/${business.id}/adspixels`, {
            params: {
              access_token: this.accessToken,
              fields: [
                'id',
                'name',
                'created_time',
                'last_fired_time',
                'owner_business',
                'owner_ad_account'
              ].join(',')
            }
          });

          if (data?.data) {
            const pixels = data.data.map((pixel: any) => ({
              id: pixel.id,
              name: pixel.name,
              created_time: pixel.created_time,
              last_fired_time: pixel.last_fired_time,
              code: pixel.code,
              owner_business_id: pixel.owner_business?.id || business.id,
              owner_business_name: pixel.owner_business?.name || business.name,
              owner_ad_account_id: pixel.owner_ad_account?.id,
              owner_ad_account_name: pixel.owner_ad_account?.name
            }));

            allPixels.push(...pixels);
          }
        } catch (businessError: any) {
          this.logger.warn(
            `Could not fetch pixels for business ${business.id}:`,
            businessError?.response?.data || businessError
          );
        }
      }

      const uniquePixels = Array.from(
        new Map(allPixels.map(pixel => [pixel.id, pixel])).values()
      );

      return uniquePixels;

    } catch (error: any) {
      this.logger.error('Error fetching Facebook Pixels:', error?.response?.data || error);
      return [];
    }
  }

  async getCatalogs(): Promise<FacebookCatalog[]> {
    try {
      this.logger.log('Fetching Facebook Catalogs');

      const adminBusinesses = await this.getBusinessAccounts();

      if (adminBusinesses.length === 0) {
        return [];
      }

      const catalogs: FacebookCatalog[] = [];

      for (const business of adminBusinesses) {
        try {
          const { data: catalogsData } = await facebookHttpClient.get(
            `/${business.id}/owned_product_catalogs`,
            {
              params: {
                access_token: this.accessToken,
                fields: 'id,name,product_count,created_time,updated_time,business_use_case_usage'
              }
            }
          );

          if (catalogsData?.data) {
            for (const catalog of catalogsData.data) {
              let role: FacebookCatalogRole | undefined;

              try {
                const { data: permData } = await facebookHttpClient.get(
                  `/${catalog.id}/assigned_users`,
                  {
                    params: {
                      access_token: this.accessToken,
                      fields: 'id,name,role',
                      business: business.id
                    }
                  }
                );

                if (permData?.data && this.userId) {
                  const userPerm = permData.data.find((user: any) => user.id === this.userId);

                  if (userPerm?.role === FacebookCatalogRole.ADMIN) {
                    role = userPerm.role;
                  } else {
                    continue;
                  }
                }
              } catch (permError: any) {
                this.logger.warn(
                  `Could not fetch permissions for catalog ${catalog.id}:`,
                  permError?.response?.data || permError
                );
                role = FacebookCatalogRole.ADMIN;
              }

              catalogs.push({
                id: catalog.id,
                name: catalog.name,
                business_id: business.id,
                product_count: catalog.product_count || 0,
                created_time: catalog.created_time,
                updated_time: catalog.updated_time
              });
            }
          }
        } catch (catalogError: any) {
          this.logger.error(
            `Error fetching catalogs for business ${business.id}:`,
            catalogError?.response?.data || catalogError
          );
        }
      }

      return catalogs;
    } catch (error: any) {
      this.logger.error('Error fetching Facebook Catalogs:', error?.response?.data || error);
      return [];
    }
  }

  async getUserAccountsData() {
    try {
      this.logger.log('Fetching all Facebook user accounts data');

      await this.getUserInfo();

      const [
        adAccounts,
        businessAccounts,
        pages,
        catalogs,
        pixels
      ] = await Promise.all([
        this.getAdAccounts(),
        this.getBusinessAccounts(),
        this.getPages(),
        this.getCatalogs(),
        this.getPixels()
      ]);

      const tokens = this.getCredentials();
      const grantedScopes = await this.getGrantedScopes();

      this.logger.log('Successfully fetched Facebook user accounts data (admin-only)');

      return {
        data: {
          facebookAdAccounts: adAccounts,
          facebookBusinessAccounts: businessAccounts,
          facebookPages: pages,
          facebookCatalogs: catalogs,
          facebookPixels: pixels,
          grantedScopes: grantedScopes
        },
        tokens
      };

    } catch (error: any) {
      this.logger.error('Error fetching Facebook user accounts data:', error);
      throw error;
    }
  }
}
