import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { PAYMENT_PROVIDER_TOKEN } from './constants/di-tokens.constant';

/**
 * Core Stripe Module
 *
 * This is a GLOBAL module that provides StripeService to the entire application.
 * It should be imported in AppModule and then available everywhere without re-importing.
 *
 * @Global decorator makes it available globally
 * @exports StripeService so other modules can inject it
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PAYMENT_PROVIDER_TOKEN, // Token for DI
      useClass: StripeService,
    },
    StripeService, // Also provide directly for convenience
  ],
  exports: [PAYMENT_PROVIDER_TOKEN, StripeService],
})
export class StripeModule {}
