import { AccessType, IAgencyBase, TFacebookAccessLink, TGoogleConnectionLink, User } from '@clientfuse/models';
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

      const googleViewLink: TGoogleConnectionLink = {
        googleAds: { email, method: 'email', isEnabled: user.isGoogleAdsAccessGranted },
        googleAnalytics: { email, isEnabled: user.isGoogleAnalyticsReadOnlyAccessGranted },
        googleMerchantCenter: { email, isEnabled: user.isGoogleMerchantCenterAccessGranted },
        googleMyBusiness: { emailOrId: email, isEnabled: user.isGoogleMyBusinessManageAccessGranted },
        googleSearchConsole: { email, isEnabled: user.isGoogleSearchConsoleReadOnlyAccessGranted },
        googleTagManager: { email, isEnabled: user.isGoogleTagManagerReadOnlyAccessGranted }
      };

      const googleManageLink: TGoogleConnectionLink = {
        googleAds: { email, method: 'email', isEnabled: user.isGoogleAdsAccessGranted },
        googleAnalytics: { email, isEnabled: user.isGoogleAnalyticsManageUsersAccessGranted },
        googleMerchantCenter: { email, isEnabled: user.isGoogleMerchantCenterAccessGranted },
        googleMyBusiness: { emailOrId: email, isEnabled: user.isGoogleMyBusinessManageAccessGranted },
        googleSearchConsole: { email, isEnabled: user.isGoogleSearchConsoleReadOnlyAccessGranted },
        googleTagManager: {
          email, isEnabled: user.isGoogleTagManagerManageUsersAccessGranted
        }
      };

      if (!foundAgency) {
        const agency: IAgencyBase = {
          userId: event.payload.userId,
          email: user.email
        };
        const createdAgency = await this.agenciesService.createAgency(agency);

        const viewLink = await this.connectionLinkService.findDefaultConnectionLink(createdAgency._id, AccessType.VIEW);
        const manageLink = await this.connectionLinkService.findDefaultConnectionLink(createdAgency._id, AccessType.MANAGE);

        if (viewLink) {
          await this.connectionLinkService.updateConnectionLink(viewLink._id, {
            google: googleViewLink
          });
        }

        if (manageLink) {
          await this.connectionLinkService.updateConnectionLink(manageLink._id, {
            google: googleManageLink
          });
        }
      } else {
        const viewLink = await this.connectionLinkService.findDefaultConnectionLink(foundAgency._id, AccessType.VIEW);
        const manageLink = await this.connectionLinkService.findDefaultConnectionLink(foundAgency._id, AccessType.MANAGE);

        if (viewLink) {
          if (!viewLink.google) {
            await this.connectionLinkService.updateConnectionLink(viewLink._id, {
              google: googleViewLink
            });
          }
        } else {
          await this.connectionLinkService.createDefaultConnectionLink(foundAgency._id, AccessType.VIEW, {
            google: googleViewLink
          });
        }

        if (manageLink) {
          if (!manageLink.google) {
            await this.connectionLinkService.updateConnectionLink(manageLink._id, {
              google: googleManageLink
            });
          }
        } else {
          await this.connectionLinkService.createDefaultConnectionLink(foundAgency._id, AccessType.MANAGE, {
            google: googleManageLink
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
        facebookAds: {
          businessPortfolioId: user.facebook.businessAccounts[0]?.id || '',
          isEnabled: user.isFacebookAdsManagementGranted
        },
        facebookBusiness: {
          businessPortfolioId: user.facebook.businessAccounts[0]?.id || '',
          isEnabled: user.isFacebookBusinessManagementGranted
        },
        facebookPages: {
          businessPortfolioId: user.facebook.businessAccounts[0]?.id || '',
          isEnabled: user.isFacebookPagesManageMetadataGranted
        },
        facebookCatalogs: {
          businessPortfolioId: user.facebook.businessAccounts[0]?.id || '',
          isEnabled: user.isFacebookCatalogManagementGranted
        },
        facebookPixels: {
          businessPortfolioId: user.facebook.businessAccounts[0]?.id || '',
          isEnabled: user.isFacebookAdsManagementGranted
        }
      };

      if (!foundAgency) {
        const agency: IAgencyBase = {
          userId: event.payload.userId,
          email: user.email
        };
        const createdAgency = await this.agenciesService.createAgency(agency);

        const viewLink = await this.connectionLinkService.findDefaultConnectionLink(createdAgency._id, AccessType.VIEW);
        const manageLink = await this.connectionLinkService.findDefaultConnectionLink(createdAgency._id, AccessType.MANAGE);

        if (viewLink) {
          await this.connectionLinkService.updateConnectionLink(viewLink._id, {
            facebook: facebookAccessLink
          });
        }

        if (manageLink) {
          await this.connectionLinkService.updateConnectionLink(manageLink._id, {
            facebook: facebookAccessLink
          });
        }
      } else {
        const viewLink = await this.connectionLinkService.findDefaultConnectionLink(foundAgency._id, AccessType.VIEW);
        const manageLink = await this.connectionLinkService.findDefaultConnectionLink(foundAgency._id, AccessType.MANAGE);

        if (viewLink) {
          if (!viewLink.facebook) {
            await this.connectionLinkService.updateConnectionLink(viewLink._id, {
              facebook: facebookAccessLink
            });
          }
        } else {
          await this.connectionLinkService.createDefaultConnectionLink(foundAgency._id, AccessType.VIEW, {
            facebook: facebookAccessLink
          });
        }

        if (manageLink) {
          if (!manageLink.facebook) {
            await this.connectionLinkService.updateConnectionLink(manageLink._id, {
              facebook: facebookAccessLink
            });
          }
        } else {
          await this.connectionLinkService.createDefaultConnectionLink(foundAgency._id, AccessType.MANAGE, {
            facebook: facebookAccessLink
          });
        }
      }
    } catch (error) {
      this.logger.error('Error in agencies-listener.service:', error);
    }
  }
}
