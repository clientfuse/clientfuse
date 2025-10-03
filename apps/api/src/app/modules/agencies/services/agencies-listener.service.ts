import { IAgencyBase, User } from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EmittedEvent,
  EventType,
  IFacebookAccountsDataUpdatedEvent,
  IGoogleAccountsDataUpdatedEvent,
  IAgencyFacebookCheckCompletedEvent,
  IAgencyGoogleCheckCompletedEvent
} from '../../../core/modules/event-bus/event-bus.model';
import { EventBusService } from '../../../core/modules/event-bus/event-bus.service';
import { UsersService } from '../../users/users.service';
import { AgenciesService } from './agencies.service';

@Injectable()
export class AgenciesListenerService {
  private readonly logger = new Logger(AgenciesService.name);

  constructor(
    private readonly agenciesService: AgenciesService,
    private readonly usersService: UsersService,
    private readonly eventBusService: EventBusService
  ) {
  }

  @OnEvent(EventType.USER_GOOGLE_ACCOUNTS_DATA_UPDATED)
  async handleAuthRegisterEvent(event: EmittedEvent<IGoogleAccountsDataUpdatedEvent>): Promise<void> {
    try {
      const foundAgency = await this.agenciesService.findAgency({ userId: event.payload.userId });

      if (!foundAgency) {
        const foundUser = await this.usersService.findUser({ _id: event.payload.userId });
        const user = new User(foundUser);

        const agency: IAgencyBase = {
          userId: event.payload.userId,
          email: user.email
        };

        const createdAgency = await this.agenciesService.createAgency(agency, event.correlationId);

        await this.eventBusService.emitAsync<IAgencyGoogleCheckCompletedEvent>(
          EventType.AGENCY_CHECKED_AFTER_GOOGLE_ACCOUNT_DATA_UPDATED,
          { agencyId: createdAgency._id, userId: event.payload.userId },
          AgenciesListenerService.name,
          event.correlationId
        );
      } else {
        await this.eventBusService.emitAsync<IAgencyGoogleCheckCompletedEvent>(
          EventType.AGENCY_CHECKED_AFTER_GOOGLE_ACCOUNT_DATA_UPDATED,
          { agencyId: foundAgency._id, userId: event.payload.userId },
          AgenciesListenerService.name,
          event.correlationId
        );
      }
    } catch (error) {
      this.logger.error('Error handling Google accounts data updated:', error);
    }
  }

  @OnEvent(EventType.USER_FACEBOOK_ACCOUNTS_DATA_UPDATED)
  async handleFacebookAccountsDataUpdated(event: EmittedEvent<IFacebookAccountsDataUpdatedEvent>): Promise<void> {
    try {
      const foundAgency = await this.agenciesService.findAgency({ userId: event.payload.userId });

      if (!foundAgency) {
        const foundUser = await this.usersService.findUser({ _id: event.payload.userId });
        const user = new User(foundUser);

        const agency: IAgencyBase = {
          userId: event.payload.userId,
          email: user.email
        };

        const createdAgency = await this.agenciesService.createAgency(agency, event.correlationId);

        await this.eventBusService.emitAsync<IAgencyFacebookCheckCompletedEvent>(
          EventType.AGENCY_CHECKED_AFTER_FACEBOOK_ACCOUNT_DATA_UPDATED,
          { agencyId: createdAgency._id, userId: event.payload.userId },
          AgenciesListenerService.name,
          event.correlationId
        );
      } else {
        await this.eventBusService.emitAsync<IAgencyFacebookCheckCompletedEvent>(
          EventType.AGENCY_CHECKED_AFTER_FACEBOOK_ACCOUNT_DATA_UPDATED,
          { agencyId: foundAgency._id, userId: event.payload.userId },
          AgenciesListenerService.name,
          event.correlationId
        );
      }
    } catch (error) {
      this.logger.error('Error handling Facebook accounts data updated:', error);
    }
  }
}
