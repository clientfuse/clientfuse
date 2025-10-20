import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ISubscriptionPlan, BillingPeriod, TierType } from '@clientfuse/models';

@Component({
  selector: 'app-tier-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './tier-card.component.html',
  styleUrl: './tier-card.component.scss'
})
export class TierCardComponent {
  private readonly tierOrder = [TierType.BRONZE, TierType.SILVER, TierType.GOLD];


  tier = input.required<ISubscriptionPlan>();
  currentPlanId = input<string | null>(null);
  hasActiveSubscription = input<boolean>(false);
  currentPlanTierType = input<TierType | null>(null);
  currentPlanBillingPeriod = input<BillingPeriod | null>(null);
  selectTier = output<ISubscriptionPlan>();
  isCurrentPlan = computed(() => this.currentPlanId() === this.tier()._id);
  isPopular = computed(() => this.tier().tierType === TierType.SILVER);
  isAnnual = computed(() => this.tier().billingPeriod === BillingPeriod.ANNUAL);
  formattedPrice = computed(() => `$${this.tier().price / 100}`);
  monthlyEquivalent = computed(() => this.isAnnual() ? `$${Math.round(this.tier().price / 12 / 100)}/month` : null);
  pricePerPeriodText = computed(() => this.isAnnual() ? 'per year (USD)' : 'per month (USD)');
  totalForPeriodText = computed(() => `${this.formattedPrice()} ${this.isAnnual() ? 'billed annually' : 'billed monthly'}`);
  isUpgrade = computed(() => {
    const currentTier = this.currentPlanTierType();
    const currentPeriod = this.currentPlanBillingPeriod();
    const targetTier = this.tier().tierType;
    const targetPeriod = this.tier().billingPeriod;

    if (!currentTier || !this.hasActiveSubscription()) return false;

    if (currentPeriod === targetPeriod) {
      return this.tierOrder.indexOf(targetTier) > this.tierOrder.indexOf(currentTier);
    }

    return false;
  });
  isDowngrade = computed(() => {
    const currentTier = this.currentPlanTierType();
    const currentPeriod = this.currentPlanBillingPeriod();
    const targetTier = this.tier().tierType;
    const targetPeriod = this.tier().billingPeriod;

    if (!currentTier || !this.hasActiveSubscription()) return false;

    if (currentPeriod === targetPeriod) {
      return this.tierOrder.indexOf(targetTier) < this.tierOrder.indexOf(currentTier);
    }

    return false;
  });

  isPeriodChange = computed(() => {
    const currentTier = this.currentPlanTierType();
    const currentPeriod = this.currentPlanBillingPeriod();
    const targetTier = this.tier().tierType;
    const targetPeriod = this.tier().billingPeriod;

    if (!currentTier || !currentPeriod || !this.hasActiveSubscription()) return false;

    return currentTier === targetTier && currentPeriod !== targetPeriod;
  });
  buttonLabel = computed(() => {
    if (this.isCurrentPlan()) return 'CURRENT PLAN';
    if (!this.hasActiveSubscription()) return 'SELECT';
    if (this.isUpgrade()) return 'UPGRADE';
    if (this.isDowngrade()) return 'DOWNGRADE';
    if (this.isPeriodChange()) {
      const targetPeriod = this.tier().billingPeriod;
      return targetPeriod === BillingPeriod.ANNUAL ? 'CHANGE TO ANNUAL' : 'CHANGE TO MONTHLY';
    }
    return 'CHANGE PLAN';
  });

  tierCardClasses = computed(() => ({
    'tier-card': true,
    'tier-card--popular': this.isPopular(),
    'tier-card--current': this.isCurrentPlan()
  }));

  onSelectTier(): void {
    if (!this.isCurrentPlan()) {
      this.selectTier.emit(this.tier());
    }
  }
}
