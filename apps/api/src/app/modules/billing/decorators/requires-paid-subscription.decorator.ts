import { SetMetadata } from '@nestjs/common';

export const REQUIRES_PAID_SUBSCRIPTION_KEY = 'requiresPaidSubscription';

/**
 * Decorator to protect endpoints that require an active paid subscription
 *
 * @example
 * @Controller('premium-features')
 * export class PremiumFeaturesController {
 *   @Get('advanced-analytics')
 *   @RequiresPaidSubscription()
 *   async getAdvancedAnalytics(@Req() req: Request) {
 *     // Only accessible to users with active subscription
 *     const userId = req.user['id'];
 *     return await this.analyticsService.getAdvanced(userId);
 *   }
 * }
 */
export const RequiresPaidSubscription = () => SetMetadata(REQUIRES_PAID_SUBSCRIPTION_KEY, true);
