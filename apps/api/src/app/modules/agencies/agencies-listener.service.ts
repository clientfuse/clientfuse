import { IAgencyBase, IGoogleAccessLink, User } from '@connectly/models';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmittedEvent, EventType, IGoogleAccountsDataUpdatedEvent } from '../../core/modules/event-bus/event-bus.model';
import { UsersService } from '../users/users.service';
import { AgenciesService } from './agencies.service';

@Injectable()
export class AgenciesListenerService {
  private readonly logger = new Logger(AgenciesService.name);

  constructor(
    private readonly agenciesService: AgenciesService,
    private readonly usersService: UsersService
  ) {
  }

  @OnEvent(EventType.GOOGLE_ACCOUNTS_DATA_UPDATED)
  async handleAuthRegisterEvent(event: EmittedEvent<IGoogleAccountsDataUpdatedEvent>): Promise<void> {
    try {
      const foundAgency = await this.agenciesService.findAgency({
        userId: event.payload.userId
      });
      const foundUser = await this.usersService.findUser({ _id: event.payload.userId });
      const user = new User(foundUser);
      const email = user.email;
      const googleDefaultAccessLink: IGoogleAccessLink = {
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
          email: user.email,
          defaultAccessLink: {
            google: googleDefaultAccessLink,
            facebook: {}
          }
        };
        await this.agenciesService.createAgency(agency);
      } else {
        await this.agenciesService.updateAgency(
          foundAgency._id,
          {
            defaultAccessLink: {
              ...foundAgency.defaultAccessLink,
              google: googleDefaultAccessLink
            }
          }
        );
      }
    } catch (error) {
      this.logger.error('Error in agencies-listener.service:', error);
    }
  }

}
