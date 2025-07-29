import { Logger } from '@nestjs/common';
import { FacebookAdsApi } from 'facebook-nodejs-business-sdk';
import { isNil } from 'lodash';
import { FacebookAdAccount, FacebookBusinessAccount, FacebookCatalog, FacebookCredentials, FacebookPage } from '../models/facebook.model';

export class FacebookAccounts {
  private readonly logger = new Logger(FacebookAccounts.name);
  private readonly accessToken: string;
  private facebookApi: FacebookAdsApi;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.facebookApi = FacebookAdsApi.init(accessToken);
  }

  getCredentials(): FacebookCredentials {
    return {
      access_token: this.accessToken
    };
  }

  async getAdAccounts(): Promise<FacebookAdAccount[]> {
    try {
      this.logger.log('Fetching Facebook Ad Accounts');

      const response = await this.facebookApi.call<any>(
        'GET',
        '/me/adaccounts',
        {
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
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((account: any) => ({
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

    } catch (error) {
      this.logger.error('Error fetching Facebook Ad Accounts:', error);

      if (error.response?.error?.code === 190) {
        this.logger.error('Access token is invalid or expired');
      }

      return [];
    }
  }

  async getBusinessAccounts(): Promise<FacebookBusinessAccount[]> {
    try {
      this.logger.log('Fetching Facebook Business Accounts');

      const response = await this.facebookApi.call<any>(
        'GET',
        '/me/businesses',
        {
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
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((business: any) => ({
        id: business.id,
        name: business.name,
        verification_status: business.verification_status,
        created_time: business.created_time,
        updated_time: business.updated_time,
        business_type: business.business_type,
        primary_page: business.primary_page
      }));

    } catch (error) {
      this.logger.error('Error fetching Facebook Business Accounts:', error);
      return [];
    }
  }

  async getPages(): Promise<FacebookPage[]> {
    try {
      this.logger.log('Fetching Facebook Pages');

      const response = await this.facebookApi.call<any>(
        'GET',
        '/me/accounts',
        {
          fields: [
            'id',
            'name',
            'category',
            'category_list',
            'access_token',
            'perms',
            'tasks',
            'verification_status',
            'fan_count'
          ].join(',')
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        category_list: page.category_list || [],
        access_token: page.access_token,
        perms: page.perms || [],
        tasks: page.tasks || [],
        verification_status: page.verification_status,
        fan_count: page.fan_count
      }));

    } catch (error) {
      this.logger.error('Error fetching Facebook Pages:', error);
      return [];
    }
  }

  async getCatalogs(): Promise<FacebookCatalog[]> {
    try {
      this.logger.log('Fetching Facebook Catalogs');

      const response = await this.facebookApi.call<any>(
        'GET',
        '/me/businesses',
        {
          fields: 'owned_product_catalogs{id,name,product_count,created_time,updated_time}'
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      const catalogs: FacebookCatalog[] = [];

      for (const business of response.data) {
        if (business.owned_product_catalogs?.data) {
          for (const catalog of business.owned_product_catalogs.data) {
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
      }

      return catalogs;

    } catch (error) {
      this.logger.error('Error fetching Facebook Catalogs:', error);
      return [];
    }
  }

  async getBusinessAdAccounts(businessId: string): Promise<FacebookAdAccount[]> {
    try {
      this.logger.log(`Fetching Ad Accounts for business ${businessId}`);

      const response = await this.facebookApi.call<any>(
        'GET',
        `/${businessId}/owned_ad_accounts`,
        {
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
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((account: any) => ({
        id: account.id,
        name: account.name || `Ad Account ${account.account_id}`,
        account_id: account.account_id,
        business_id: businessId,
        currency: account.currency,
        timezone_name: account.timezone_name,
        account_status: account.account_status,
        created_time: account.created_time
      }));

    } catch (error) {
      this.logger.error(`Error fetching Ad Accounts for business ${businessId}:`, error);
      return [];
    }
  }

  async getBusinessPages(businessId: string): Promise<FacebookPage[]> {
    try {
      this.logger.log(`Fetching Pages for business ${businessId}`);

      const response = await this.facebookApi.call<any>(
        'GET',
        `/${businessId}/owned_pages`,
        {
          fields: [
            'id',
            'name',
            'category',
            'category_list',
            'verification_status',
            'fan_count'
          ].join(',')
        }
      );

      if (isNil(response.data)) {
        return [];
      }

      return response.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        category_list: page.category_list || [],
        perms: [],
        tasks: [],
        verification_status: page.verification_status,
        fan_count: page.fan_count
      }));

    } catch (error) {
      this.logger.error(`Error fetching Pages for business ${businessId}:`, error);
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

      this.logger.log('Successfully fetched Facebook user accounts data');

      return {
        data: {
          facebookAdAccounts: adAccounts,
          facebookBusinessAccounts: businessAccounts,
          facebookPages: pages,
          facebookCatalogs: catalogs
        },
        tokens
      };

    } catch (error) {
      this.logger.error('Error fetching Facebook user accounts data:', error);
      throw error;
    }
  }
}
