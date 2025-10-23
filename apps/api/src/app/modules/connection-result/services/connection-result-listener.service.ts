import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EmittedEvent,
  EventType,
  IAgencyMergeCompletedEvent
} from '../../../core/modules/event-bus/event-bus.model';
import { ConnectionResultService } from './connection-result.service';

@Injectable()
export class ConnectionResultListenerService {
  private readonly logger = new Logger(ConnectionResultListenerService.name);

  constructor(
    private readonly connectionResultService: ConnectionResultService
  ) {
  }

  @OnEvent(EventType.AGENCIES_MERGED)
  async handleAgenciesMerged(event: EmittedEvent<IAgencyMergeCompletedEvent>): Promise<void> {
    try {
      this.logger.log(
        `${event.correlationId} Handling ${event.type} for ${event.payload.allAgencyIds.length} agencies merging into ${event.payload.mergedAgencyId}`
      );

      const modifiedCount = await this.connectionResultService.transferConnectionResultsToAgency(
        event.payload.allAgencyIds,
        event.payload.mergedAgencyId
      );

      this.logger.log(
        `Successfully transferred ${modifiedCount} connection results from agencies ${event.payload.allAgencyIds.join(', ')} to ${event.payload.mergedAgencyId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to transfer connection results for agencies ${event.payload.allAgencyIds.join(', ')}:`,
        error
      );
      throw error;
    }
  }
}
