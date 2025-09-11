import { IAgencyBase, TFacebookAccessLink, TGoogleConnectionLink, User } from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EmittedEvent,
  EventType,
  IFacebookAccountsDataUpdatedEvent,
  IGoogleAccountsDataUpdatedEvent
} from '../../../core/modules/event-bus/event-bus.model';
import { ConnectionLinkService } from '../../connection-link/services/connection-link.service';
import { UsersService } from '../../users/users.service';
import { AgenciesService } from './agencies.service';

@Injectable()
export class AgenciesListenerService {
  private readonly logger = new Logger(AgenciesService.name);

  constructor(
    private readonly agenciesService: AgenciesService,
    private readonly usersService: UsersService,
    private connectionLinkService: ConnectionLinkService
  ) {
  }

  @OnEvent(EventType.GOOGLE_ACCOUNTS_DATA_UPDATED)
  async handleAuthRegisterEvent(event: EmittedEvent<IGoogleAccountsDataUpdatedEvent>): Promise<void> {
    try {
      const foundAgency = await this.agenciesService.findAgency({ userId: event.payload.userId });
      const foundUser = await this.usersService.findUser({ _id: event.payload.userId });
      const user = new User(foundUser);
      const email = user.email;
      const googleAccessLink: TGoogleConnectionLink = {
        ads: {
          email,
          method: 'email',
          isManageAccessEnabled: user.isGoogleAdsAccessGranted,
          isViewAccessEnabled: user.isGoogleAdsAccessGranted
        },
        analytics: {
          email,
          isViewAccessEnabled: user.isGoogleAnalyticsReadOnlyAccessGranted,
          isManageAccessEnabled: user.isGoogleAnalyticsManageUsersAccessGranted
        },
        merchantCenter: {
          email,
          isViewAccessEnabled: user.isGoogleMerchantCenterAccessGranted,
          isManageAccessEnabled: user.isGoogleMerchantCenterAccessGranted
        },
        myBusiness: {
          emailOrId: email,
          isViewAccessEnabled: user.isGoogleMyBusinessManageAccessGranted,
          isManageAccessEnabled: user.isGoogleMyBusinessManageAccessGranted
        },
        searchConsole: {
          email,
          isViewAccessEnabled: user.isGoogleSearchConsoleReadOnlyAccessGranted,
          isManageAccessEnabled: user.isGoogleSearchConsoleReadOnlyAccessGranted
        },
        tagManager: {
          email,
          isViewAccessEnabled: user.isGoogleTagManagerReadOnlyAccessGranted,
          isManageAccessEnabled: user.isGoogleTagManagerManageUsersAccessGranted
        }
      };


      if (!foundAgency) {
        const agency: IAgencyBase = {
          userId: event.payload.userId,
          email: user.email
        };
        const createdAgency = await this.agenciesService.createAgency(agency);

        const defaultConnectionLink = await this.connectionLinkService.findDefaultConnectionLink(createdAgency._id);
        if (defaultConnectionLink) {
          await this.connectionLinkService.updateConnectionLink(defaultConnectionLink._id, {
            google: googleAccessLink
          });
        }
      } else {
        const defaultConnectionLink = await this.connectionLinkService.findDefaultConnectionLink(foundAgency._id);
        if (defaultConnectionLink) {
          if (defaultConnectionLink.google) return;

          await this.connectionLinkService.updateConnectionLink(defaultConnectionLink._id, {
            google: googleAccessLink
          });
        } else {
          await this.connectionLinkService.createDefaultConnectionLink(foundAgency._id, {
            google: googleAccessLink
          });
        }
      }
    } catch (error) {
      this.logger.error('Error in agencies-listener.service:', error);
    }
  }

  @OnEvent(EventType.FACEBOOK_ACCOUNTS_DATA_UPDATED)
  async handleFacebookAccountsDataUpdated(event: EmittedEvent<IFacebookAccountsDataUpdatedEvent>): Promise<void> {
    try {
      const foundAgency = await this.agenciesService.findAgency({ userId: event.payload.userId });
      const foundUser = await this.usersService.findUser({ _id: event.payload.userId });
      const user = new User(foundUser);

      const facebookAccessLink: TFacebookAccessLink = {
        ads: {
          businessPortfolioId: user.facebook.businessAccounts[0]?.id || '',
          isViewAccessEnabled: user.isFacebookAdsManagementGranted,
          isManageAccessEnabled: user.isFacebookAdsManagementGranted
        },
        business: {
          businessPortfolioId: user.facebook.businessAccounts[0]?.id || '',
          isViewAccessEnabled: user.isFacebookBusinessManagementGranted,
          isManageAccessEnabled: user.isFacebookBusinessManagementGranted
        },
        pages: {
          businessPortfolioId: user.facebook.businessAccounts[0]?.id || '',
          isViewAccessEnabled: user.isFacebookPagesManageMetadataGranted,
          isManageAccessEnabled: user.isFacebookPagesManageMetadataGranted
        },
        catalogs: {
          businessPortfolioId: user.facebook.businessAccounts[0]?.id || '',
          isViewAccessEnabled: user.isFacebookCatalogManagementGranted,
          isManageAccessEnabled: user.isFacebookCatalogManagementGranted
        },
        pixels: {
          businessPortfolioId: user.facebook.businessAccounts[0]?.id || '',
          isViewAccessEnabled: user.isFacebookAdsManagementGranted,
          isManageAccessEnabled: user.isFacebookAdsManagementGranted
        },
      };

      if (!foundAgency) {
        const agency: IAgencyBase = {
          userId: event.payload.userId,
          email: user.email
        };
        const createdAgency = await this.agenciesService.createAgency(agency);

        const defaultConnectionLink = await this.connectionLinkService.findDefaultConnectionLink(createdAgency._id);
        if (defaultConnectionLink) {
          await this.connectionLinkService.updateConnectionLink(defaultConnectionLink._id, {
            facebook: facebookAccessLink
          });
        }
      } else {
        const defaultConnectionLink = await this.connectionLinkService.findDefaultConnectionLink(foundAgency._id);
        if (defaultConnectionLink) {
          if (defaultConnectionLink.facebook) return;

          await this.connectionLinkService.updateConnectionLink(defaultConnectionLink._id, {
            facebook: facebookAccessLink
          });
        } else {
          await this.connectionLinkService.createDefaultConnectionLink(foundAgency._id, {
            facebook: facebookAccessLink
          });
        }
      }
    } catch (error) {
      this.logger.error('Error in agencies-listener.service:', error);
    }
  }
}
