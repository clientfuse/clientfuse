import { randomUUID } from 'crypto';

// *** Correlation ID utility for request tracing ***
export class CorrelationIdGenerator {

  // *** Generate standard UUID v4 correlation ID ***
  static generate(): string {
    return randomUUID();
  }

  // *** Generate correlation ID with custom prefix ***
  static generateWithPrefix(prefix: string): string {
    return `${prefix}-${randomUUID()}`;
  }

  // *** Generate short correlation ID (12 chars) ***
  static generateShort(): string {
    return randomUUID().replace(/-/g, '').substring(0, 12);
  }

  // *** Generate correlation ID with timestamp ***
  static generateWithTimestamp(): string {
    const timestamp = Date.now().toString(36);
    const uuid = randomUUID().replace(/-/g, '').substring(0, 8);
    return `${timestamp}-${uuid}`;
  }

  // *** Validate correlation ID format ***
  static isValid(correlationId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(correlationId);
  }

  // *** Extract correlation ID from request headers ***
  static extractFromHeaders(headers: Record<string, string | string[] | undefined>): string | null {
    const headerValue = headers['x-correlation-id'] || headers['correlation-id'];
    if (typeof headerValue === 'string') {
      return headerValue;
    }
    return null;
  }

  // *** Get or generate correlation ID from request ***
  static getOrGenerate(headers: Record<string, string | string[] | undefined>): string {
    const existing = this.extractFromHeaders(headers);
    return existing || this.generate();
  }
}

// *** Simple function exports for quick usage ***
export const generateCorrelationId = (): string => CorrelationIdGenerator.generate();
export const generateCorrelationIdWithPrefix = (prefix: string): string => CorrelationIdGenerator.generateWithPrefix(prefix);
