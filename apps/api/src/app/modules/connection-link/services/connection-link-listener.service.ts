import { AccessType, TFacebookAccessLink, TGoogleConnectionLink, User } from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EmittedEvent,
  EventType,
  IAgencyMergeCompletedEvent,
  IAgencyCreatedEvent,
  IIntegrationFacebookConnectedEvent,
  IIntegrationGoogleConnectedEvent,
  IIntegrationFacebookDisconnectedEvent,
  IIntegrationGoogleDisconnectedEvent,
  IAgencyFacebookCheckCompletedEvent,
  IAgencyGoogleCheckCompletedEvent
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

  @OnEvent(EventType.GOOGLE_DISCONNECTED_INTERNAL)
  async handleDisconnectGoogle(event: EmittedEvent<IIntegrationGoogleDisconnectedEvent>): Promise<void> {
    try {
      this.logger.log(`${event.correlationId} Handling ${event.type} event for user ${event.payload.userId}`);

      const agency = await this.agenciesService.findAgency({ userId: event.payload.userId });

      if (!agency) {
        this.logger.warn(`Agency not found for user ${event.payload.userId}`);
        return;
      }

      const connectionLinks = await this.connectionLinkService.findConnectionLinks({ agencyId: agency._id });

      for (const link of connectionLinks) {
        if (link.google) {
          await this.connectionLinkService.updateConnectionLink(link._id, {
            google: null
          });
          this.logger.log(`Removed Google connection from link ${link._id}`);
        }
      }

      this.logger.log(`Successfully removed Google from all connection links for user ${event.payload.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle disconnect Google event for user ${event.payload.userId}:`,
        error
      );
    }
  }

  @OnEvent(EventType.GOOGLE_CONNECTED_INTERNAL)
  async handleConnectInternalGoogle(event: EmittedEvent<IIntegrationGoogleConnectedEvent>): Promise<void> {
    try {
      this.logger.log(`${event.correlationId} Handling ${event.type} event for user ${event.payload.userId}`);

      const agency = await this.agenciesService.findAgency({ userId: event.payload.userId });

      if (!agency) {
        this.logger.warn(`Agency not found for user ${event.payload.userId}`);
        return;
      }

      const foundUser = await this.usersService.findUser({ _id: event.payload.userId });
      const user = new User(foundUser);

      await this.processGoogleConnectionLinks(agency._id, user, false);
    } catch (error) {
      this.logger.error(
        `Failed to handle connect internal Google event for user ${event.payload.userId}:`,
        error
      );
    }
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

  @OnEvent(EventType.FACEBOOK_DISCONNECTED_INTERNAL)
  async handleDisconnectFacebook(event: EmittedEvent<IIntegrationFacebookDisconnectedEvent>): Promise<void> {
    try {
      this.logger.log(`${event.correlationId} Handling ${event.type} event for user ${event.payload.userId}`);

      const agency = await this.agenciesService.findAgency({ userId: event.payload.userId });

      if (!agency) {
        this.logger.warn(`Agency not found for user ${event.payload.userId}`);
        return;
      }

      const connectionLinks = await this.connectionLinkService.findConnectionLinks({ agencyId: agency._id });

      for (const link of connectionLinks) {
        if (link.facebook) {
          await this.connectionLinkService.updateConnectionLink(link._id, {
            facebook: null
          });
          this.logger.log(`Removed Facebook connection from link ${link._id}`);
        }
      }

      this.logger.log(`Successfully removed Facebook from all connection links for user ${event.payload.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle disconnect Facebook event for user ${event.payload.userId}:`,
        error
      );
    }
  }

  @OnEvent(EventType.FACEBOOK_CONNECTED_INTERNAL)
  async handleConnectInternalFacebook(event: EmittedEvent<IIntegrationFacebookConnectedEvent>): Promise<void> {
    try {
      this.logger.log(`${event.correlationId} Handling ${event.type} event for user ${event.payload.userId}`);

      const agency = await this.agenciesService.findAgency({ userId: event.payload.userId });

      if (!agency) {
        this.logger.warn(`Agency not found for user ${event.payload.userId}`);
        return;
      }

      const foundUser = await this.usersService.findUser({ _id: event.payload.userId });
      const user = new User(foundUser);

      await this.processFacebookConnectionLinks(agency._id, user, false);
    } catch (error) {
      this.logger.error(
        `Failed to handle connect internal Facebook event for user ${event.payload.userId}:`,
        error
      );
    }
  }

  @OnEvent(EventType.AGENCY_CHECKED_AFTER_GOOGLE_ACCOUNT_DATA_UPDATED)
  async handleUpdateGoogleConnectionLinks(event: EmittedEvent<IAgencyGoogleCheckCompletedEvent>): Promise<void> {
    try {
      this.logger.log(`${event.correlationId} Handling ${event.type} for agency ${event.payload.agencyId}`);

      const foundUser = await this.usersService.findUser({ _id: event.payload.userId });
      const user = new User(foundUser);

      await this.processGoogleConnectionLinks(event.payload.agencyId, user, true);
    } catch (error) {
      this.logger.error(
        `Failed to update Google connection links for agency ${event.payload.agencyId}:`,
        error
      );
    }
  }

  @OnEvent(EventType.AGENCY_CHECKED_AFTER_FACEBOOK_ACCOUNT_DATA_UPDATED)
  async handleUpdateFacebookConnectionLinks(event: EmittedEvent<IAgencyFacebookCheckCompletedEvent>): Promise<void> {
    try {
      this.logger.log(`${event.correlationId} Handling ${event.type} for agency ${event.payload.agencyId}`);

      const foundUser = await this.usersService.findUser({ _id: event.payload.userId });
      const user = new User(foundUser);

      await this.processFacebookConnectionLinks(event.payload.agencyId, user, true);
    } catch (error) {
      this.logger.error(
        `Failed to update Facebook connection links for agency ${event.payload.agencyId}:`,
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
