import { computed, inject, Injectable, signal } from '@angular/core';
import { BillingPeriod, ISubscriptionPlan, ISubscriptionResponse, SubscriptionStatus } from '@clientfuse/models';
import { BillingApiService } from './billing-api.service';

@Injectable({ providedIn: 'root' })
export class BillingStoreService {
  private billingApiService = inject(BillingApiService);

  private subscription = signal<ISubscriptionResponse | null>(null);
  private plans = signal<ISubscriptionPlan[]>([]);
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  readonly currentSubscription = this.subscription.asReadonly();
  readonly availablePlans = this.plans.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly hasActiveSubscription = computed(() => {
    const sub = this.subscription();
    return sub?.status === SubscriptionStatus.ACTIVE || sub?.status === SubscriptionStatus.TRIALING;
  });

  readonly currentPlan = computed(() => {
    const sub = this.subscription();
    if (!sub) return null;

    // Return plan only if subscription is active or trialing
    const isActive = sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIALING;
    return isActive ? sub.plan : null;
  });

  readonly subscriptionEndDate = computed(() => {
    const sub = this.subscription();
    return sub?.currentPeriodEnd || null;
  });

  readonly isTrialing = computed(() => {
    const sub = this.subscription();
    return sub?.status === SubscriptionStatus.TRIALING;
  });

  readonly isPastDue = computed(() => {
    const sub = this.subscription();
    return sub?.status === SubscriptionStatus.PAST_DUE;
  });

  readonly isCanceling = computed(() => {
    const sub = this.subscription();
    if (!sub) return false;
    return sub.cancelAtPeriodEnd || !!sub.cancelAt;
  });

  readonly plansByPeriod = computed(() => {
    const allPlans = this.plans();

    return {
      [BillingPeriod.MONTHLY]: allPlans.filter(p => p.billingPeriod === BillingPeriod.MONTHLY),
      [BillingPeriod.ANNUAL]: allPlans.filter(p => p.billingPeriod === BillingPeriod.ANNUAL)
    };
  });

  async loadSubscription(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.billingApiService.getSubscription();
      this.subscription.set(response.payload);
    } catch (error: any) {
      this.subscription.set(null);

      if (error.status && error.status !== 404) {
        this.error.set(error.message || 'Failed to load subscription');
        console.error('Failed to load subscription:', error);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async loadPlans(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.billingApiService.getPlans();
      this.plans.set(response.payload);
    } catch (error: any) {
      this.error.set(error.message || 'Failed to load plans');
      this.plans.set([]);
      console.error('Failed to load plans:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async startCheckout(planId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.billingApiService.createCheckoutSession({
        planId,
        successUrl: `${window.location.origin}/settings/billing?success=true`,
        cancelUrl: `${window.location.origin}/settings/billing?canceled=true`
      });

      window.location.href = response.payload.url;
    } catch (error: any) {
      this.error.set(error.message || 'Failed to start checkout');
      this.loading.set(false);
      console.error('Failed to start checkout:', error);
    }
  }

  async openPortal(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.billingApiService.createPortalSession({
        returnUrl: `${window.location.origin}/settings/billing`
      });

      window.location.href = response.payload.url;
    } catch (error: any) {
      this.error.set(error.message || 'Failed to open portal');
      this.loading.set(false);
      console.error('Failed to open portal:', error);
    }
  }

  clearError(): void {
    this.error.set(null);
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.loadSubscription(),
      this.loadPlans()
    ]);
  }
}
