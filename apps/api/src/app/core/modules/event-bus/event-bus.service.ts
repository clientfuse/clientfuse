import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmittedEvent, EventType } from './event-bus.model';
import { generateCorrelationId } from './event-bus.utils';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {
  }

  emit<T>(
    type: EventType,
    payload: T,
    source: string,
    correlationId?: string
  ): boolean {
    source = source || 'API';
    correlationId = correlationId || generateCorrelationId();
    const eventPayload = new EmittedEvent<T>(type, payload, source, correlationId);

    this.logger.log(`${correlationId} Emitting event: ${type}`, {
      payload: eventPayload.payload
    });

    return this.eventEmitter.emit(type, eventPayload);
  }

  async emitAsync<T>(
    type: EventType,
    payload: T,
    source: string,
    correlationId?: string
  ): Promise<any[]> {
    source = source || 'API';
    correlationId = correlationId || generateCorrelationId();
    const eventPayload = new EmittedEvent<T>(type, payload, source, correlationId);

    this.logger.log(`Emitting event: ${type}`, {
      correlationId,
      payload: eventPayload.payload
    });

    try {
      const results = await this.eventEmitter.emitAsync(type, eventPayload);

      this.logger.log(`${correlationId} Event completed successfully: ${type}`);

      return results;
    } catch (error) {
      this.logger.error(`Event failed: ${type} - ${error.message}`, { correlationId });
      throw error;
    }
  }
}
