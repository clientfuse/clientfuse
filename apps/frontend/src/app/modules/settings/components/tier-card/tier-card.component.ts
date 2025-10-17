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
  tier = input.required<ISubscriptionPlan>();
  currentPlanId = input<string | null>(null);
  selectTier = output<ISubscriptionPlan>();

  isCurrentPlan = computed(() => this.currentPlanId() === this.tier()._id);
  isPopular = computed(() => this.tier().tierType === TierType.SILVER);
  isAnnual = computed(() => this.tier().billingPeriod === BillingPeriod.ANNUAL);
  formattedPrice = computed(() => `$${this.tier().price / 100}`);
  monthlyEquivalent = computed(() => this.isAnnual() ? `$${Math.round(this.tier().price / 12 / 100)}/month` : null);
  pricePerPeriodText = computed(() => this.isAnnual() ? 'per year (USD)' : 'per month (USD)');
  totalForPeriodText = computed(() => `${this.formattedPrice()} ${this.isAnnual() ? 'billed annually' : 'billed monthly'}`);
  buttonLabel = computed(() => this.isCurrentPlan() ? 'CURRENT PLAN' : 'SELECT');

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
