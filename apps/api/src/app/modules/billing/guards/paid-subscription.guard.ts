import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_PAID_SUBSCRIPTION_KEY } from '../decorators/requires-paid-subscription.decorator';
import { SubscriptionService } from '../services/subscription.service';

/**
 * Guard to check if user has active paid subscription
 *
 * This guard is checked AFTER authentication (JwtAuthGuard).
 * It verifies that the authenticated user has an active subscription.
 */
@Injectable()
export class PaidSubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresPaidSubscription = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_PAID_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresPaidSubscription) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasActiveSubscription = await this.subscriptionService.hasActiveSubscription(user.id);

    if (!hasActiveSubscription) {
      throw new ForbiddenException('This feature requires an active subscription. Please upgrade your plan.');
    }

    return true;
  }
}
