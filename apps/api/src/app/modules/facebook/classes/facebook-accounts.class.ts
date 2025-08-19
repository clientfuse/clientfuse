import { FacebookAdAccount, FacebookBusinessAccount, FacebookCatalog, FacebookCredentials, FacebookPage } from '@clientfuse/models';
import { Logger } from '@nestjs/common';
import { isNil } from 'lodash';
import { facebookHttpClient } from '../../../core/utils/http';

export class FacebookAccounts {
  private readonly logger = new Logger(FacebookAccounts.name);
  private readonly accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  getCredentials(): FacebookCredentials {
    return {
      access_token: this.accessToken
    };
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
            'created_time'
          ].join(',')
        }
      });

      if (isNil(data?.data)) {
        return [];
      }

      return data.data.map((account: any) => ({
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

      return data.data.map((business: any) => ({
        id: business.id,
        name: business.name,
        verification_status: business.verification_status,
        created_time: business.created_time,
        updated_time: business.updated_time,
        business_type: business.business_type,
        primary_page: business.primary_page
      }));

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

      return data.data.map((page: any) => ({
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

    } catch (error: any) {
      this.logger.error('Error fetching Facebook Pages:', error?.response?.data || error);
      return [];
    }
  }

  async getCatalogs(): Promise<FacebookCatalog[]> {
    try {
      this.logger.log('Fetching Facebook Catalogs');

      const { data: businessesData } = await facebookHttpClient.get('/me/businesses', {
        params: {
          access_token: this.accessToken,
          fields: 'id,name'
        }
      });

      if (isNil(businessesData?.data)) {
        return [];
      }

      const catalogs: FacebookCatalog[] = [];

      for (const business of businessesData.data) {
        try {
          const { data: catalogsData } = await facebookHttpClient.get(
            `/${business.id}/owned_product_catalogs`,
            {
              params: {
                access_token: this.accessToken,
                fields: 'id,name,product_count,created_time,updated_time'
              }
            }
          );

          if (catalogsData?.data) {
            for (const catalog of catalogsData.data) {
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

  async getBusinessAdAccounts(businessId: string): Promise<FacebookAdAccount[]> {
    try {
      this.logger.log(`Fetching Ad Accounts for business ${businessId}`);

      const { data } = await facebookHttpClient.get(`/${businessId}/owned_ad_accounts`, {
        params: {
          access_token: this.accessToken,
          fields: [
            'id',
            'name',
            'account_id',
            'currency',
            'timezone_name',
            'account_status',
            'created_time'
          ].join(',')
        }
      });

      if (isNil(data?.data)) {
        return [];
      }

      return data.data.map((account: any) => ({
        id: account.id,
        name: account.name || `Ad Account ${account.account_id}`,
        account_id: account.account_id,
        business_id: businessId,
        currency: account.currency,
        timezone_name: account.timezone_name,
        account_status: account.account_status,
        created_time: account.created_time
      }));

    } catch (error: any) {
      this.logger.error(
        `Error fetching Ad Accounts for business ${businessId}:`,
        error?.response?.data || error
      );
      return [];
    }
  }

  async getBusinessPages(businessId: string): Promise<FacebookPage[]> {
    try {
      this.logger.log(`Fetching Pages for business ${businessId}`);

      const { data } = await facebookHttpClient.get(`/${businessId}/owned_pages`, {
        params: {
          access_token: this.accessToken,
          fields: [
            'id',
            'name',
            'category',
            'category_list',
            'verification_status',
            'fan_count'
          ].join(',')
        }
      });

      if (isNil(data?.data)) {
        return [];
      }

      return data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        category_list: page.category_list || [],
        perms: [],
        tasks: [],
        verification_status: page.verification_status,
        fan_count: page.fan_count
      }));

    } catch (error: any) {
      this.logger.error(
        `Error fetching Pages for business ${businessId}:`,
        error?.response?.data || error
      );
      return [];
    }
  }

  async getUserAccountsData() {
    try {
      this.logger.log('Fetching all Facebook user accounts data');

      const [
        adAccounts,
        businessAccounts,
        pages,
        catalogs
      ] = await Promise.all([
        this.getAdAccounts(),
        this.getBusinessAccounts(),
        this.getPages(),
        this.getCatalogs()
      ]);

      const tokens = this.getCredentials();
      const grantedScopes = await this.getGrantedScopes();

      this.logger.log('Successfully fetched Facebook user accounts data');

      return {
        data: {
          facebookAdAccounts: adAccounts,
          facebookBusinessAccounts: businessAccounts,
          facebookPages: pages,
          facebookCatalogs: catalogs,
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
