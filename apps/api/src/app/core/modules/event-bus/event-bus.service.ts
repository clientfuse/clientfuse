import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmittedEvent, EventType } from './event-bus.model';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {
  }

  emit<T>(
    type: EventType,
    payload: T,
    source: string = 'API',
    correlationId?: string
  ): boolean {
    const eventPayload = new EmittedEvent<T>(type, payload, source, correlationId);

    this.logger.log(`Emitting event: ${type}`, {
      correlationId,
      payload: eventPayload.payload
    });

    return this.eventEmitter.emit(type, eventPayload);
  }

  async emitAsync<T>(
    type: EventType,
    payload: T,
    correlationId?: string,
    source: string = 'API'
  ): Promise<any[]> {
    const eventPayload = new EmittedEvent<T>(type, payload, source, correlationId);

    this.logger.log(`Emitting event: ${type}`, {
      correlationId,
      payload: eventPayload.payload
    });

    try {
      const results = await this.eventEmitter.emitAsync(type, eventPayload);

      this.logger.log(`Event completed successfully: ${type}`, {
        correlationId,
        listenersCount: results.length
      });

      return results;
    } catch (error) {
      this.logger.error(`Event failed: ${type} - ${error.message}`, { correlationId });
      throw error;
    }
  }
}
