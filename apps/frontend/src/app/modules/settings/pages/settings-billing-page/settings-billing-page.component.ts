import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute } from '@angular/router';
import { BillingPeriod, ISubscriptionPlan, SubscriptionStatus } from '@clientfuse/models';
import { BillingStoreService } from '../../../../services/billing/billing-store.service';
import { SnackbarService } from '../../../../services/snackbar.service';
import { TierCardComponent } from '../../components/tier-card/tier-card.component';

@Component({
  selector: 'app-settings-billing-page',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TierCardComponent
  ],
  templateUrl: './settings-billing-page.component.html',
  styleUrl: './settings-billing-page.component.scss'
})
export class SettingsBillingPageComponent implements OnInit {
  private billingStore = inject(BillingStoreService);
  private route = inject(ActivatedRoute);
  private snackbarService = inject(SnackbarService);

  billingPeriod = signal<BillingPeriod>(BillingPeriod.MONTHLY);
  readonly currentSubscription = this.billingStore.currentSubscription;
  readonly isLoading = this.billingStore.isLoading;
  readonly plansByPeriod = this.billingStore.plansByPeriod;
  readonly hasActiveSubscription = this.billingStore.hasActiveSubscription;
  readonly currentPlan = this.billingStore.currentPlan;
  readonly isCanceling = this.billingStore.isCanceling;
  readonly isAnnual = computed(() => this.billingPeriod() === BillingPeriod.ANNUAL);
  readonly selectedPeriodPlans = computed(() => this.plansByPeriod()[this.billingPeriod()]);
  readonly currentPlanId = computed(() => this.currentPlan()?._id || null);
  readonly currentPlanTierType = computed(() => this.currentPlan()?.tierType || null);
  readonly currentPlanBillingPeriod = computed(() => this.currentPlan()?.billingPeriod || null);
  readonly subscriptionStatusText = computed(() => {
    const sub = this.currentSubscription();
    if (!sub) return 'No active subscription';

    const statusMap: Record<SubscriptionStatus, string> = {
      [SubscriptionStatus.ACTIVE]: 'Active',
      [SubscriptionStatus.CANCELED]: 'Canceled',
      [SubscriptionStatus.INCOMPLETE]: 'Incomplete',
      [SubscriptionStatus.INCOMPLETE_EXPIRED]: 'Incomplete Expired',
      [SubscriptionStatus.PAST_DUE]: 'Past Due',
      [SubscriptionStatus.PAUSED]: 'Paused',
      [SubscriptionStatus.TRIALING]: 'Trial',
      [SubscriptionStatus.UNPAID]: 'Unpaid'
    };

    const status = statusMap[sub.status];

    if (this.isCanceling()) {
      const cancelDate = sub.cancelAt || sub.currentPeriodEnd;
      return `${status} (ends ${this.formatDate(cancelDate)})`;
    }

    return status;
  });
  readonly billingPeriodText = computed(() => {
    const sub = this.currentSubscription();
    if (!sub) return 'N/A';
    return `${this.formatDate(sub.currentPeriodStart)} - ${this.formatDate(sub.currentPeriodEnd)}`;
  });

  async ngOnInit(): Promise<void> {
    await this.billingStore.initialize();
    this.handleQueryParams();

    const currentPlan = this.currentPlan();
    if (currentPlan) {
      this.billingPeriod.set(currentPlan.billingPeriod);
    }
  }

  private handleQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        this.snackbarService.success(
          'Subscription activated successfully! Thank you for subscribing.',
          'Close'
        );
        this.billingStore.loadSubscription();
      } else if (params['canceled']) {
        this.snackbarService.info(
          'Checkout canceled. Feel free to try again when ready.',
          'Close'
        );
      }
    });
  }

  billingPeriodChanged($event: MatSlideToggleChange): void {
    const value = $event.checked ? BillingPeriod.ANNUAL : BillingPeriod.MONTHLY;
    this.billingPeriod.set(value);
  }

  async onSelectTier(plan: ISubscriptionPlan): Promise<void> {
    if (this.hasActiveSubscription()) {
      await this.openPortal();
    } else {
      await this.billingStore.startCheckout(plan._id);
    }
  }

  async openPortal(): Promise<void> {
    await this.billingStore.openPortal();
  }

  private formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
