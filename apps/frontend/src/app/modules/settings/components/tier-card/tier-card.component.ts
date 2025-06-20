import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type TierType = 'starter' | 'agency' | 'pro' | 'enterprise';

export type TierPeriod = 'monthly' | 'annual';

export type ITierInfo = {
  buttonLabel: string;
  name: string;
  type: TierType;
  price: string;
  discountPrice: string | null;
  isAnnual: boolean;
  totalForPeriod: string;
  features: string[];
  isPopular: boolean;
}

@Component({
  selector: 'app-tier-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './tier-card.component.html',
  styleUrl: './tier-card.component.scss'
})
export class TierCardComponent {
  tier = input.required<ITierInfo>();
  pricePerPeriodText = computed(() => {
    if (this.tier().type === 'enterprise') return '&nbsp;';
    return this.tier().isAnnual ? `per year (USD)` : `per month (USD)`;
  });
  totalForPeriodText = computed(() => {
    if (this.tier().type === 'enterprise') return '&nbsp;';
    return this.tier().isAnnual
      ? `${this.tier().totalForPeriod} billed annually`
      : `${this.tier().totalForPeriod} billed monthly`;
  });
  tierCardClasses = computed(() => {
    return {
      'tier-card': true,
      'tier-card--popular': this.tier().isPopular
    };
  });
}
