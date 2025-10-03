import { AccessType, TFacebookAccessLink, TGoogleConnectionLink, TPlatformNamesKeys, User } from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EmittedEvent,
  EventType,
  IAgencyCreatedEvent,
  IAgencyFacebookCheckCompletedEvent,
  IAgencyGoogleCheckCompletedEvent,
  IAgencyMergeCompletedEvent,
  IIntegrationFacebookConnectedEvent,
  IIntegrationFacebookDisconnectedEvent,
  IIntegrationGoogleConnectedEvent,
  IIntegrationGoogleDisconnectedEvent
} from '../../../core/modules/event-bus/event-bus.model';
import { AgenciesService } from '../../agencies/services/agencies.service';
import { UsersService } from '../../users/users.service';
import { ConnectionLinkMergeService } from './connection-link-merge.service';
import { ConnectionLinkService } from './connection-link.service';

@Injectable()
export class ConnectionLinkListenerService {
  private readonly logger = new Logger(ConnectionLinkListenerService.name);

  constructor(
    private readonly connectionLinkService: ConnectionLinkService,
    private readonly agenciesService: AgenciesService,
    private readonly usersService: UsersService,
    private readonly connectionLinkMergeService: ConnectionLinkMergeService
  ) {
  }

  @OnEvent(EventType.AGENCY_CREATED)
  async handleAgencyCreated(event: EmittedEvent<IAgencyCreatedEvent>): Promise<void> {
    try {
      this.logger.log(`${event.correlationId} Handling ${event.type} event for agency ${event.payload.agencyId}`);

      await this.connectionLinkService.createDefaultConnectionLinks(event.payload.agencyId);

      this.logger.log(`Successfully created default connection links for agency ${event.payload.agencyId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create default connection links for agency ${event.payload.agencyId}:`,
        error
      );
    }
  }

  @OnEvent(EventType.AGENCIES_MERGED)
  async handleAgenciesMerged(event: EmittedEvent<IAgencyMergeCompletedEvent>): Promise<void> {
    try {
      this.logger.log(
        `${event.correlationId} Handling ${event.type} for ${event.payload.allAgencyIds.length} agencies merging into ${event.payload.mergedAgencyId}`
      );

      await this.connectionLinkMergeService.mergeDefaultConnectionLinks(
        event.payload.allAgencyIds,
        event.payload.mergedAgencyId
      );

      this.logger.log(
        `Successfully merged connection links for agencies ${event.payload.allAgencyIds.join(', ')} into ${event.payload.mergedAgencyId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to merge connection links for agencies ${event.payload.allAgencyIds.join(', ')}:`,
        error
      );
      throw error;
    }
  }

  @OnEvent(EventType.GOOGLE_DISCONNECTED_INTERNAL)
  async handleDisconnectGoogle(event: EmittedEvent<IIntegrationGoogleDisconnectedEvent>): Promise<void> {
    await this.handlePlatformDisconnect('google', event.payload.userId, event.correlationId);
  }

  @OnEvent(EventType.GOOGLE_CONNECTED_INTERNAL)
  async handleConnectInternalGoogle(event: EmittedEvent<IIntegrationGoogleConnectedEvent>): Promise<void> {
    await this.handlePlatformConnect('google', event.payload.userId, event.correlationId);
  }


  @OnEvent(EventType.FACEBOOK_DISCONNECTED_INTERNAL)
  async handleDisconnectFacebook(event: EmittedEvent<IIntegrationFacebookDisconnectedEvent>): Promise<void> {
    await this.handlePlatformDisconnect('facebook', event.payload.userId, event.correlationId);
  }

  @OnEvent(EventType.FACEBOOK_CONNECTED_INTERNAL)
  async handleConnectInternalFacebook(event: EmittedEvent<IIntegrationFacebookConnectedEvent>): Promise<void> {
    await this.handlePlatformConnect('facebook', event.payload.userId, event.correlationId);
  }

  @OnEvent(EventType.AGENCY_CHECKED_AFTER_GOOGLE_ACCOUNT_DATA_UPDATED)
  async handleUpdateGoogleConnectionLinks(event: EmittedEvent<IAgencyGoogleCheckCompletedEvent>): Promise<void> {
    await this.handlePlatformUpdate('google', event.payload.agencyId, event.payload.userId, event.correlationId);
  }

  @OnEvent(EventType.AGENCY_CHECKED_AFTER_FACEBOOK_ACCOUNT_DATA_UPDATED)
  async handleUpdateFacebookConnectionLinks(event: EmittedEvent<IAgencyFacebookCheckCompletedEvent>): Promise<void> {
    await this.handlePlatformUpdate('facebook', event.payload.agencyId, event.payload.userId, event.correlationId);
  }

  private async handlePlatformDisconnect(
    platform: TPlatformNamesKeys,
    userId: string,
    correlationId: string
  ): Promise<void> {
    try {
      this.logger.log(`${correlationId} Handling ${platform} disconnect event for user ${userId}`);

      const agency = await this.agenciesService.findAgency({ userId });

      if (!agency) {
        this.logger.warn(`Agency not found for user ${userId}`);
        return;
      }

      const connectionLinks = await this.connectionLinkService.findConnectionLinks({ agencyId: agency._id });

      for (const link of connectionLinks) {
        if (link[platform]) {
          await this.connectionLinkService.updateConnectionLink(link._id, {
            [platform]: null
          });
          this.logger.log(`Removed ${platform} connection from link ${link._id}`);
        }
      }

      this.logger.log(`Successfully removed ${platform} from all connection links for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle disconnect ${platform} event for user ${userId}:`,
        error
      );
    }
  }

  private async handlePlatformConnect(
    platform: TPlatformNamesKeys,
    userId: string,
    correlationId: string
  ): Promise<void> {
    try {
      this.logger.log(`${correlationId} Handling ${platform} connect event for user ${userId}`);

      const agency = await this.agenciesService.findAgency({ userId });

      if (!agency) {
        this.logger.warn(`Agency not found for user ${userId}`);
        return;
      }

      const foundUser = await this.usersService.findUser({ _id: userId });
      const user = new User(foundUser);

      if (platform === 'google') {
        await this.processGoogleConnectionLinks(agency._id, user, false);
      } else if (platform === 'facebook') {
        await this.processFacebookConnectionLinks(agency._id, user, false);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle connect internal ${platform} event for user ${userId}:`,
        error
      );
    }
  }

  private async handlePlatformUpdate(
    platform: TPlatformNamesKeys,
    agencyId: string,
    userId: string,
    correlationId: string
  ): Promise<void> {
    try {
      this.logger.log(`${correlationId} Handling ${platform} update for agency ${agencyId}`);

      const foundUser = await this.usersService.findUser({ _id: userId });
      const user = new User(foundUser);

      if (platform === 'google') {
        await this.processGoogleConnectionLinks(agencyId, user, true);
      } else if (platform === 'facebook') {
        await this.processFacebookConnectionLinks(agencyId, user, true);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update ${platform} connection links for agency ${agencyId}:`,
        error
      );
    }
  }

  private async updateOrCreateConnectionLink(
    agencyId: string,
    accessType: AccessType,
    platform: 'google' | 'facebook',
    platformData: TGoogleConnectionLink | TFacebookAccessLink,
    skipIfExists: boolean = false
  ): Promise<void> {
    const existingLink = await this.connectionLinkService.findDefaultConnectionLink(agencyId, accessType);

    if (existingLink) {
      // Skip update if data already exists and skipIfExists is true
      if (skipIfExists && existingLink[platform]) {
        return;
      }

      await this.connectionLinkService.updateConnectionLink(existingLink._id, {
        [platform]: platformData
      });
      this.logger.log(`Updated ${platform} data in ${accessType} link ${existingLink._id}`);
    } else {
      await this.connectionLinkService.createDefaultConnectionLink(agencyId, accessType, {
        [platform]: platformData
      });
      this.logger.log(`Created ${accessType} link with ${platform} data for agency ${agencyId}`);
    }
  }

  private async processGoogleConnectionLinks(
    agencyId: string,
    user: User,
    skipIfExists: boolean = false
  ): Promise<void> {
    const googleViewLink = this.buildGoogleViewLink(user);
    const googleManageLink = this.buildGoogleManageLink(user);

    await this.updateOrCreateConnectionLink(agencyId, AccessType.VIEW, 'google', googleViewLink, skipIfExists);
    await this.updateOrCreateConnectionLink(
      agencyId,
      AccessType.MANAGE,
      'google',
      googleManageLink,
      skipIfExists
    );

    this.logger.log(`Successfully updated Google connection links for agency ${agencyId}`);
  }

  private async processFacebookConnectionLinks(
    agencyId: string,
    user: User,
    skipIfExists: boolean = false
  ): Promise<void> {
    const facebookAccessLink = this.buildFacebookAccessLink(user);

    await this.updateOrCreateConnectionLink(
      agencyId,
      AccessType.VIEW,
      'facebook',
      facebookAccessLink,
      skipIfExists
    );
    await this.updateOrCreateConnectionLink(
      agencyId,
      AccessType.MANAGE,
      'facebook',
      facebookAccessLink,
      skipIfExists
    );

    this.logger.log(`Successfully updated Facebook connection links for agency ${agencyId}`);
  }

  private buildGoogleViewLink(user: User): TGoogleConnectionLink {
    const email = user.email;
    return {
      googleAds: { email, method: 'email', isEnabled: user.isGoogleAdsAccessGranted },
      googleAnalytics: { email, isEnabled: user.isGoogleAnalyticsReadOnlyAccessGranted },
      googleMerchantCenter: { email, isEnabled: user.isGoogleMerchantCenterAccessGranted },
      googleMyBusiness: { emailOrId: email, isEnabled: user.isGoogleMyBusinessManageAccessGranted },
      googleSearchConsole: { email, isEnabled: user.isGoogleSearchConsoleReadOnlyAccessGranted },
      googleTagManager: { email, isEnabled: user.isGoogleTagManagerReadOnlyAccessGranted }
    };
  }

  private buildGoogleManageLink(user: User): TGoogleConnectionLink {
    const email = user.email;
    return {
      googleAds: { email, method: 'email', isEnabled: user.isGoogleAdsAccessGranted },
      googleAnalytics: { email, isEnabled: user.isGoogleAnalyticsManageUsersAccessGranted },
      googleMerchantCenter: { email, isEnabled: user.isGoogleMerchantCenterAccessGranted },
      googleMyBusiness: { emailOrId: email, isEnabled: user.isGoogleMyBusinessManageAccessGranted },
      googleSearchConsole: { email, isEnabled: user.isGoogleSearchConsoleReadOnlyAccessGranted },
      googleTagManager: { email, isEnabled: user.isGoogleTagManagerManageUsersAccessGranted }
    };
  }

  private buildFacebookAccessLink(user: User): TFacebookAccessLink {
    const businessPortfolioId = user.facebook.businessAccounts[0]?.id || '';
    return {
      facebookAds: { businessPortfolioId, isEnabled: user.isFacebookAdsManagementGranted },
      facebookBusiness: { businessPortfolioId, isEnabled: user.isFacebookBusinessManagementGranted },
      facebookPages: { businessPortfolioId, isEnabled: user.isFacebookPagesManageMetadataGranted },
      facebookCatalogs: { businessPortfolioId, isEnabled: user.isFacebookCatalogManagementGranted },
      facebookPixels: { businessPortfolioId, isEnabled: user.isFacebookAdsManagementGranted }
    };
  }
}
