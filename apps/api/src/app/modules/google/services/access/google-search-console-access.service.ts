import {
  ApiEnv,
  GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE,
  GoogleSearchConsolePermission,
  IBaseAccessRequest,
  IBaseAccessResponse,
  IBaseUserInfo,
  ICustomAccessOptions,
  IGoogleBaseAccessService
} from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { google } from 'googleapis';
import { isEmpty, isNil } from 'lodash';

@Injectable()
export class GoogleSearchConsoleAccessService implements IGoogleBaseAccessService {
  private readonly logger = new Logger(GoogleSearchConsoleAccessService.name);
  private oauth2Client: OAuth2Client = new google.auth.OAuth2(
    this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_ID),
    this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_SECRET),
    this.configService.get<string>(ApiEnv.GOOGLE_CALLBACK_URL)
  );

  constructor(private readonly configService: ConfigService) {
  }

  async grantManagementAccess(siteUrl: string, agencyEmail: string): Promise<IBaseAccessResponse> {
    this.logger.log(`Granting Search Console management access to ${agencyEmail} for site ${siteUrl}`);

    return this.grantAgencyAccess({
      entityId: siteUrl,
      agencyEmail: agencyEmail,
      permissions: ['FULL']
    });
  }

  async grantReadOnlyAccess(siteUrl: string, agencyEmail: string): Promise<IBaseAccessResponse> {
    this.logger.log(`Granting Search Console read-only access to ${agencyEmail} for site ${siteUrl}`);

    return this.grantAgencyAccess({
      entityId: siteUrl,
      agencyEmail: agencyEmail,
      permissions: ['RESTRICTED']
    });
  }

  async grantCustomAccess(options: ICustomAccessOptions): Promise<IBaseAccessResponse> {
    this.logger.warn(`Granting custom access is not supported for Google Search Console. Use management or read-only access instead.`);
    return {
      success: false,
      error: 'Custom access is not supported for Google Search Console. Use management or read-only access instead.'
    };
  }

  setCredentials(tokens: { access_token?: string; refresh_token?: string }): void {
    if (isEmpty(tokens) || isNil(tokens)) {
      throw new Error('Tokens are required for Google Search Console access management');
    }
    this.oauth2Client.setCredentials(tokens);
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<IBaseAccessResponse> {
    return {
      success: false,
      error: 'Google Search Console API does not support direct user management for URL-prefix properties. Users must be added through the web interface.'
    };
  }

  async checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null> {
    this.logger.warn('Cannot determine specific user access - Search Console API limitation');
    return null;
  }

  async getEntityUsers(entityId: string): Promise<IBaseUserInfo[]> {
    this.logger.warn('Google Search Console API does not support user listing');
    return [];
  }

  async updateUserPermissions(entityId: string, linkId: string, permissions: string[]): Promise<IBaseAccessResponse> {
    this.logger.warn('Google Search Console API does not support user permission updates');
    return {
      success: false,
      error: 'Google Search Console API does not support user permission updates. Changes must be made through the web interface.'
    };
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IBaseAccessResponse> {
    this.logger.warn('Google Search Console API does not support user removal');
    return {
      success: false,
      error: 'Google Search Console API does not support user removal. Changes must be made through the web interface.'
    };
  }

  validateRequiredScopes(grantedScopes: string[]): boolean {
    const requiredScopes = this.getRequiredScopes();
    return requiredScopes.every(scope =>
      grantedScopes.some(granted => granted.includes(scope))
    );
  }

  getDefaultAgencyPermissions(): GoogleSearchConsolePermission[] {
    return ['RESTRICTED'];
  }

  getAllAvailablePermissions(): GoogleSearchConsolePermission[] {
    return ['FULL', 'RESTRICTED'];
  }

  getRequiredScopes(): string[] {
    return [GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE];
  }
}
