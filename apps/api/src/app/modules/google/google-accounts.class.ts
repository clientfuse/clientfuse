import { Logger } from '@nestjs/common';
import { Credentials } from 'google-auth-library/build/src/auth/credentials';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { google } from 'googleapis';
import { isEmpty, isNil } from 'lodash';

export class GoogleAccounts {
  private readonly oauth2Client: OAuth2Client;

  constructor(clientId: string, clientSecret: string, redirectUrl: string) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUrl
    );
  }

  setCredentials(tokens: { access_token?: string; refresh_token?: string }) {
    if (isEmpty(tokens) || isNil(tokens)) {
      throw new Error('Tokens are required');
    }

    this.oauth2Client.setCredentials(tokens);
  }

  getUpdatedTokens(): Credentials {
    return this.oauth2Client.credentials;
  }

  async refreshTokens(): Promise<Credentials> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);

      return this.getUpdatedTokens();
    } catch (error) {
      Logger.error('Error refreshing tokens:', error);
      throw new Error('Failed to refresh tokens');
    }
  }

  // async getGoogleAdsAccounts() { todo uncomment when Google Ads integration is needed
  //   try {
  //     // *** Note: Google Ads API requires special setup and MCC account ***
  //     // *** This is a simplified example - actual implementation needs Google Ads API client ***
  //
  //     // For Google Ads, you typically need to use the Google Ads API directly
  //     // which requires additional setup including Manager Account access
  //
  //     // Alternative: Use Google Ads Management API if available
  //     const googleAds = google.googleads({ version: 'v16', auth: this.oauth2Client });
  //
  //     // *** This is a placeholder - actual Google Ads API integration is more complex ***
  //     Logger.warn('Google Ads API requires special setup with MCC account');
  //     return [];
  //
  //   } catch (error) {
  //     Logger.error('Error fetching Google Ads accounts:', error);
  //     return [];
  //   }
  // }

  async getGoogleAnalyticsAccounts() {
    try {
      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      const response = await analytics.management.accounts.list();

      if (isNil(response.data.items)) {
        return [];
      }

      return response.data.items;
    } catch (error) {
      Logger.error('Error fetching Analytics accounts:', error);
      return [];
    }
  }

  async getGoogleSearchConsoleAccounts() {
    try {
      const searchConsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client });

      const response = await searchConsole.sites.list();

      if (isNil(response.data.siteEntry)) {
        return [];
      }

      return response.data.siteEntry;
    } catch (error) {
      Logger.error('Error fetching Search Console sites:', error);
      return [];
    }
  }

  async getGoogleTagManagerAccounts() {
    try {
      const tagManager = google.tagmanager({ version: 'v2', auth: this.oauth2Client });

      const response = await tagManager.accounts.list();

      if (isNil(response.data.account)) {
        return [];
      }

      return response.data.account;
    } catch (error) {
      Logger.error('Error fetching Tag Manager accounts:', error);
      return [];
    }
  }

  async getGoogleMerchantCenterAccounts() {
    try {
      const content = google.content({ version: 'v2.1', auth: this.oauth2Client });

      const response = await content.accounts.authinfo();

      if (isNil(response.data.accountIdentifiers)) {
        return [];
      }

      return response.data.accountIdentifiers;
    } catch (error) {
      Logger.error('Error fetching Merchant Center accounts:', error);
      return [];
    }
  }

  async getGoogleMyBusinessAccounts() {
    try {
      const myBusiness = google.mybusinessaccountmanagement({
        version: 'v1',
        auth: this.oauth2Client
      });

      const response = await myBusiness.accounts.list();

      if (isNil(response.data.accounts)) {
        return [];
      }

      return response.data.accounts;
    } catch (error) {
      Logger.error('Error fetching My Business accounts:', error);
      return [];
    }
  }

  async getGoogleMyBusinessLocations() {
    try {
      const accounts = await this.getGoogleMyBusinessAccounts();
      const locations = [];

      const myBusinessInfo = google.mybusinessbusinessinformation({
        version: 'v1',
        auth: this.oauth2Client
      });

      for (const account of accounts) {
        try {
          const response = await myBusinessInfo.accounts.locations.list({
            parent: `accounts/${account.accountNumber}`
          });

          if (!isNil(response.data.locations)) {
            locations.push(...response.data.locations);
          }
        } catch (locationError) {
          Logger.error(`Error fetching locations for account ${account.accountNumber}:`, locationError);
        }
      }

      return locations;

    } catch (error) {
      Logger.error('Error fetching My Business locations:', error);
      return [];
    }
  }

  getGrantedScopes(): string[] {
    const credentials = this.oauth2Client.credentials;
    if (isNil(credentials) || isNil(credentials.scope)) {
      return [];
    }

    if (typeof credentials.scope === 'string') {
      return credentials.scope.split(' ');
    }

    return Array.isArray(credentials.scope) ? credentials.scope : [];
  }

  async getUserAccountsData() {
    try {
      Logger.log('Fetching user accounts data...');
      await this.refreshTokens();

      const [
        // googleAdsAccounts,
        googleAnalyticsAccounts,
        googleSearchConsoles,
        googleTagManagers
        // googleMerchantCenters,
        // googleMyBusinessAccounts,
        // googleMyBusinessLocations
      ] = await Promise.all([
        // this.getGoogleAdsAccounts(),
        this.getGoogleAnalyticsAccounts(),
        this.getGoogleSearchConsoleAccounts(),
        this.getGoogleTagManagerAccounts()
        // this.getGoogleMerchantCenterAccounts(),
        // this.getGoogleMyBusinessAccounts(),
        // this.getGoogleMyBusinessLocations()
      ]);

      const googleGrantedScopes = this.getGrantedScopes();
      const updatedTokens = this.getUpdatedTokens();

      return {
        data: {
          // googleAdsAccounts,
          googleAnalyticsAccounts,
          googleSearchConsoles,
          googleTagManagers,
          // googleMerchantCenters,
          // googleMyBusinessAccounts,
          // googleMyBusinessLocations,
          googleGrantedScopes
        },
        tokens: updatedTokens
      };
    } catch (error) {
      Logger.error('Error fetching user accounts data:', error);
      throw error;
    }
  }
}
