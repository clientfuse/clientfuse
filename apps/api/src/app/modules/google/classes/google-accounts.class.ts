import { Logger } from '@nestjs/common';
import { GoogleAdsApi } from 'google-ads-api';
import { Credentials } from 'google-auth-library/build/src/auth/credentials';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { google } from 'googleapis';
import { isEmpty, isNil } from 'lodash';

export interface VerifiedGoogleUser {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

export interface LoginInitResult {
  user: VerifiedGoogleUser;
  hasValidTokens: boolean;
  requiresReauth: boolean;
}

export class GoogleAccounts {
  private readonly oauth2Client: OAuth2Client;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly googleAdsDeveloperToken: string;
  private verifiedUser: VerifiedGoogleUser | null = null;

  constructor(
    clientId: string,
    clientSecret: string,
    redirectUrl: string,
    googleAdsDeveloperToken: string
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.googleAdsDeveloperToken = googleAdsDeveloperToken;
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUrl
    );
  }

  async verifyAndInitialize(idToken: string, tokens?: { access_token?: string; refresh_token?: string }): Promise<LoginInitResult> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: this.clientId
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('Invalid token payload');
      }

      this.verifiedUser = {
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified || false,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        aud: payload.aud,
        iss: payload.iss,
        iat: payload.iat,
        exp: payload.exp
      } as VerifiedGoogleUser;

      let hasValidTokens = false;
      let requiresReauth = false;

      if (tokens && (!isEmpty(tokens.access_token) || !isEmpty(tokens.refresh_token))) {
        this.setCredentials(tokens);
        hasValidTokens = true;

        try {
          await this.oauth2Client.getAccessToken();
        } catch (error) {
          Logger.warn('Provided tokens are invalid, reauth required');
          requiresReauth = true;
          hasValidTokens = false;
        }
      } else {
        requiresReauth = true;
      }

      Logger.log(`User ${this.verifiedUser.email} verified successfully`);

      return {
        user: this.verifiedUser,
        hasValidTokens,
        requiresReauth
      };

    } catch (error) {
      Logger.error('Failed to verify idToken:', error);
      throw new Error('Invalid Google ID token');
    }
  }

  setCredentials(tokens: { access_token?: string; refresh_token?: string }) {
    if (isEmpty(tokens) || isNil(tokens)) {
      throw new Error('Tokens are required');
    }

    this.oauth2Client.setCredentials(tokens);
  }

  getCredentials(): Credentials {
    return this.oauth2Client.credentials;
  }

  async refreshTokens(): Promise<Credentials> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);

      return this.getCredentials();
    } catch (error) {
      Logger.error('Error refreshing tokens:');
      console.error(error);
      throw new Error('Failed to refresh tokens');
    }
  }

  async getGoogleAdsAccounts() {
    try {
      const googleAdsClient = new GoogleAdsApi({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        developer_token: this.googleAdsDeveloperToken
      });

      const credentials = this.getCredentials();

      if (!credentials.refresh_token) {
        Logger.warn('No refresh token available for Google Ads');
        return [];
      }

      const customerResourceNames = (await googleAdsClient.listAccessibleCustomers(
        credentials.refresh_token
      ))?.resource_names;

      if (isNil(customerResourceNames) || isEmpty(customerResourceNames)) {
        return [];
      }

      const accounts = [];
      const userEmail = this.verifiedUser?.email;

      for (const resourceName of customerResourceNames) {
        try {
          const customerId = resourceName.split('/')[1];

          const customer = googleAdsClient.Customer({
            customer_id: customerId,
            refresh_token: credentials.refresh_token
          });

          const [customerDetails] = await customer.query(`
            SELECT customer.id,
                   customer.descriptive_name,
                   customer.currency_code,
                   customer.time_zone,
                   customer.auto_tagging_enabled,
                   customer.status,
                   customer.resource_name,
                   customer_user_access.access_role,
                   customer_user_access.email_address
            FROM customer_user_access
            WHERE customer_user_access.email_address = '${userEmail}' LIMIT 1
          `);

          // Only include accounts where user has ADMIN access role
          // Access roles: ADMIN, STANDARD, READ_ONLY, EMAIL_ONLY
          if (customerDetails && customerDetails.customer_user_access?.access_role === 'ADMIN') {
            accounts.push({
              id: customerDetails.customer.id,
              name: customerDetails.customer.descriptive_name || `Account ${customerDetails.customer.id}`,
              currencyCode: customerDetails.customer.currency_code,
              timeZone: customerDetails.customer.time_zone,
              status: customerDetails.customer.status,
              resourceName: customerDetails.customer.resource_name,
              autoTaggingEnabled: customerDetails.customer.auto_tagging_enabled
            });
          }
        } catch (accountError) {
          Logger.warn(`Error fetching Google Ads account details for ${resourceName}:`);
          console.error(accountError);
        }
      }

      return accounts;
    } catch (error) {
      Logger.error('Error fetching Google Ads accounts:', error);

      if (error.message?.includes('developer_token')) {
        Logger.error('Google Ads API requires a valid developer token from a Manager Account (MCC)');
      }

      return [];
    }
  }

  async getGoogleAnalyticsAccounts() {
    try {
      const analytics = google.analytics({ version: 'v3', auth: this.oauth2Client });

      const response = await analytics.management.accounts.list();

      if (isNil(response.data.items)) {
        return [];
      }

      // Filter to only return accounts where user has MANAGE_USERS permission (owner/admin)
      const ownedAccounts = response.data.items.filter(account => {
        const permissions = account.permissions?.effective || [];
        return permissions.includes('MANAGE_USERS');
      });

      return ownedAccounts;
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

      // Filter to only return sites where user is an owner
      // Search Console permissions: 'siteOwner', 'siteFullUser', 'siteRestrictedUser', 'siteUnverifiedUser'
      const ownedSites = response.data.siteEntry.filter(site => {
        return site.permissionLevel === 'siteOwner';
      });

      return ownedSites;
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

      const userEmail = this.verifiedUser?.email;
      if (!userEmail) {
        return response.data.account;
      }

      const ownedAccounts = [];

      for (const account of response.data.account) {
        try {
          const permissionsResponse = await tagManager.accounts.user_permissions.list({
            parent: account.path
          });

          if (permissionsResponse.data.userPermission) {
            const userPermission = permissionsResponse.data.userPermission.find(
              perm => perm.emailAddress?.toLowerCase() === userEmail.toLowerCase()
            );

            if (userPermission?.accountAccess?.permission === 'admin') {
              ownedAccounts.push(account);
            }
          }
        } catch (permError) {
          Logger.warn(`Could not fetch permissions for GTM account ${account.accountId}:`, permError);
          ownedAccounts.push(account);
        }
      }

      return ownedAccounts;
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

      // For Merchant Center, we'll return all accessible accounts
      // The Content API v2.1 doesn't provide a direct way to check admin status
      // without additional permissions that may not be granted
      // Filtering can be done at a higher level if needed
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

      const userEmail = this.verifiedUser?.email;
      if (!userEmail) {
        return response.data.accounts;
      }

      const ownedAccounts = [];

      for (const account of response.data.accounts) {
        try {
          const adminsResponse = await myBusiness.accounts.admins.list({
            parent: account.name
          });

          if (adminsResponse.data.accountAdmins) {
            const currentUserAdmin = adminsResponse.data.accountAdmins.find(
              admin => admin.admin?.toLowerCase() === userEmail.toLowerCase()
            );

            if (currentUserAdmin?.role === 'PRIMARY_OWNER' || currentUserAdmin?.role === 'OWNER') {
              ownedAccounts.push(account);
            }
          }
        } catch (adminError) {
          // If we can't fetch admins, skip this account
          Logger.warn(`Could not fetch admins for My Business account ${account.name}:`, adminError);
        }
      }

      return ownedAccounts;
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

  async getUserAccountsData(ignoreTokenRefresh = false) {
    try {
      if (!ignoreTokenRefresh) {
        await this.refreshTokens();
      }

      const [
        googleAdsAccounts,
        googleAnalyticsAccounts,
        googleSearchConsoles,
        googleTagManagers,
        googleMerchantCenters,
        googleMyBusinessAccounts,
        googleMyBusinessLocations
      ] = await Promise.all([
        this.getGoogleAdsAccounts(),
        this.getGoogleAnalyticsAccounts(),
        this.getGoogleSearchConsoleAccounts(),
        this.getGoogleTagManagerAccounts(),
        this.getGoogleMerchantCenterAccounts(),
        this.getGoogleMyBusinessAccounts(),
        this.getGoogleMyBusinessLocations()
      ]);

      const googleGrantedScopes = this.getGrantedScopes();
      const updatedTokens = this.getCredentials();

      Logger.log('Fetched user accounts data successfully');
      return {
        data: {
          googleAdsAccounts,
          googleAnalyticsAccounts,
          googleSearchConsoles,
          googleTagManagers,
          googleMerchantCenters,
          googleMyBusinessAccounts,
          googleMyBusinessLocations,
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
