import {
  ApiEnv,
  GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE,
  GoogleServiceType,
  IBaseAccessRequest,
  IGrantAccessResponse,
  IBaseUserInfo,
  IBaseGetEntityUsersParams,
  IGoogleBaseAccessService,
  IRevokeAccessResponse,
  TAccessType
} from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { google } from 'googleapis';
import { isEmpty, isNil } from 'lodash';
import { AgenciesService } from '../../../agencies/services/agencies.service';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class GoogleSearchConsoleAccessService implements IGoogleBaseAccessService {
  private readonly logger = new Logger(GoogleSearchConsoleAccessService.name);
  private oauth2Client: OAuth2Client = new google.auth.OAuth2(
    this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_ID),
    this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_SECRET),
    this.configService.get<string>(ApiEnv.GOOGLE_CALLBACK_URL)
  );

  constructor(
    private readonly configService: ConfigService,
    private readonly agenciesService: AgenciesService,
    private readonly usersService: UsersService
  ) {
  }

  async grantManagementAccess(siteUrl: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting Search Console management access to ${agencyEmail} for site ${siteUrl}`);

    const result = await this.grantAgencyAccess({
      entityId: siteUrl,
      agencyIdentifier: agencyEmail,
      permissions: ['FULL']
    });

    return {
      ...result,
      service: GoogleServiceType.SEARCH_CONSOLE,
      accessType: 'manage' as TAccessType,
      entityId: siteUrl,
      agencyIdentifier: agencyEmail
    };
  }

  async grantViewAccess(siteUrl: string, agencyEmail: string): Promise<IGrantAccessResponse> {
    this.logger.log(`Granting Search Console view access to ${agencyEmail} for site ${siteUrl}`);

    const result = await this.grantAgencyAccess({
      entityId: siteUrl,
      agencyIdentifier: agencyEmail,
      permissions: ['RESTRICTED']
    });

    return {
      ...result,
      service: GoogleServiceType.SEARCH_CONSOLE,
      accessType: 'view' as TAccessType,
      entityId: siteUrl,
      agencyIdentifier: agencyEmail
    };
  }


  setCredentials(tokens: { access_token?: string; refresh_token?: string }): void {
    if (isEmpty(tokens) || isNil(tokens)) {
      throw new Error('Tokens are required for Google Search Console access management');
    }
    this.oauth2Client.setCredentials(tokens);
  }

  async grantAgencyAccess(request: IBaseAccessRequest): Promise<IGrantAccessResponse> {
    return {
      success: false,
      service: GoogleServiceType.SEARCH_CONSOLE,
      accessType: this.determineAccessType(request.permissions),
      entityId: request.entityId,
      agencyIdentifier: request.agencyIdentifier,
      error: 'Google Search Console API does not support direct user management for URL-prefix properties. Users must be added through the web interface.'
    };
  }

  async checkExistingUserAccess(entityId: string, email: string): Promise<IBaseUserInfo | null> {
    this.logger.warn('Cannot determine specific user access - Search Console API limitation');
    return null;
  }

  async getEntityUsers(params: IBaseGetEntityUsersParams): Promise<IBaseUserInfo[]> {
    const { entityId, agencyId } = params;

    try {
      if (agencyId) {
        const agency = await this.agenciesService.findAgency({ _id: agencyId });
        if (!agency || !agency.userId) {
          this.logger.warn(`Agency ${agencyId} not found or has no associated user`);
          return [];
        }

        const user = await this.usersService.findUser({ _id: agency.userId });
        if (!user || !user.google || !user.google.accessToken) {
          this.logger.warn(`User ${agency.userId} not found or has no Google access token`);
          return [];
        }

        const userOAuth2Client = new google.auth.OAuth2(
          this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_ID),
          this.configService.get<string>(ApiEnv.GOOGLE_CLIENT_SECRET),
          this.configService.get<string>(ApiEnv.GOOGLE_CALLBACK_URL)
        );
        userOAuth2Client.setCredentials({ access_token: user.google.accessToken });

        const searchConsole = google.searchconsole('v1');
        const response = await searchConsole.sites.list({
          auth: userOAuth2Client
        });

        if (response.data && response.data.siteEntry) {
          const site = response.data.siteEntry.find(s => s.siteUrl === entityId);
          if (site && site.permissionLevel) {
            return [
              {
                linkId: user.email,
                email: user.email,
                permissions: [site.permissionLevel],
                kind: 'searchconsole#user'
              }
            ];
          }
        }

        return [];
      }

      // Original logic when no agencyId is provided
      const searchConsole = google.searchconsole('v1');
      const response = await searchConsole.sites.list({
        auth: this.oauth2Client
      });

      if (response.data && response.data.siteEntry) {
        const site = response.data.siteEntry.find(s => s.siteUrl === entityId);
        if (site && site.permissionLevel) {
          const userEmail = 'current_user@domain.com';
          return [
            {
              linkId: userEmail,
              email: userEmail,
              permissions: [site.permissionLevel],
              kind: 'searchconsole#user'
            }
          ];
        }
      }
    } catch (error) {
      this.logger.error(`Failed to check Search Console access: ${error.message}`);
      return [];
    }
  }

  async revokeUserAccess(entityId: string, linkId: string): Promise<IRevokeAccessResponse> {
    this.logger.warn('Google Search Console API does not support user removal');
    return {
      success: false,
      service: GoogleServiceType.SEARCH_CONSOLE,
      error: 'Google Search Console API does not support user removal. Changes must be made through the web interface.'
    };
  }

  validateRequiredScopes(grantedScopes: string[]): boolean {
    const requiredScopes = this.getRequiredScopes();
    return requiredScopes.every(scope =>
      grantedScopes.some(granted => granted.includes(scope))
    );
  }

  getRequiredScopes(): string[] {
    return [GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE];
  }

  private determineAccessType(permissions: string[]): TAccessType {
    const firstPermission = permissions[0];
    return firstPermission === 'FULL' || firstPermission === 'siteOwner' || firstPermission === 'siteFullUser' ? 'manage' : 'view';
  }
}
