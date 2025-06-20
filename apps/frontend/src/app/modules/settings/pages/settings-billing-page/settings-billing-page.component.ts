import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ITierInfo, TierCardComponent, TierPeriod, TierType } from '../../components/tier-card/tier-card.component';

@Component({
  selector: 'app-settings-billing-page',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, TierCardComponent],
  templateUrl: './settings-billing-page.component.html',
  styleUrl: './settings-billing-page.component.scss'
})
export class SettingsBillingPageComponent {

  billingPeriod = signal<TierPeriod>('annual');
  isAnnual = computed(() => this.billingPeriod() === 'annual');
  mockTiers = signal<Record<TierPeriod, Record<TierType, ITierInfo>>>({
    monthly: {
      starter: {
        buttonLabel: 'SELECT',
        name: 'Starter',
        type: 'starter',
        price: '$49',
        discountPrice: null,
        isAnnual: false,
        totalForPeriod: '$49',
        features: [
          'Onboard (Manage Access) up to 3 new clients per month',
          'Audit (View Access) up to 10 prospects per month',
          '3 month credit rollover',
          'Overage fee: $30 per 3 extra credits'
        ],
        isPopular: false
      },
      agency: {
        buttonLabel: 'SELECT',
        name: 'Agency',
        type: 'agency',
        price: '$99',
        discountPrice: null,
        isAnnual: false,
        totalForPeriod: '$99',
        features: [
          'Onboard (Manage Access) up to 10 new clients per month',
          'Audit (View Access) up to 50 prospects per month',
          '3 month credit rollover',
          'Overage fee: $30 per 5 extra credits'
        ],
        isPopular: true
      },
      pro: {
        buttonLabel: 'SELECT',
        name: 'Pro',
        type: 'pro',
        price: '$249',
        discountPrice: null,
        isAnnual: false,
        totalForPeriod: '$249',
        features: [
          'Onboard (Manage Access) up to 50 new clients per month',
          'Audit (View Access) up to 250 prospects per month',
          '3 month credit rollover',
          'Overage fee: $30 per 10 extra credits',
          'Whitelabel & Embed on your website',
          'Webhooks to automate',
          'Teams: Add unlimited team members'
        ],
        isPopular: false
      },
      enterprise: {
        buttonLabel: 'BOOK A DEMO',
        name: 'Enterprise',
        type: 'enterprise',
        price: 'Talk to us',
        discountPrice: null,
        isAnnual: false,
        totalForPeriod: 'Talk to us',
        features: [
          'Onboard (Manage Access) a custom amount of new clients',
          'Custom amount of View Access credits (for auditing)',
          'Custom amount of credit rollover',
          'Overage Fee: custom amount',
          'Whitelabel & Embed on your website',
          'Webhooks to automate',
          'Teams: Add unlimited team members',
          'API access',
          'Other Custom integrations'
        ],
        isPopular: false
      }
    },
    annual: {
      starter: {
        buttonLabel: 'SELECT',
        name: 'Starter',
        type: 'starter',
        price: '$49',
        discountPrice: '$41',
        isAnnual: true,
        totalForPeriod: '$490',
        features: [
          'Onboard (Manage Access) up to 36 new clients per year',
          'Audit (View Access) up to 120 prospects per year',
          '3 month credit rollover',
          'Overage fee: $30 per 3 extra credits'
        ],
        isPopular: false
      },
      agency: {
        buttonLabel: 'SELECT',
        name: 'Agency',
        type: 'agency',
        price: '$99',
        discountPrice: '$83',
        isAnnual: true,
        totalForPeriod: '$990',
        features: [
          'Onboard (Manage Access) up to 120 new clients per year',
          'Audit (View Access) up to 600 prospects per year',
          '3 month credit rollover',
          'Overage fee: $30 per 5 extra credits'
        ],
        isPopular: true
      },
      pro: {
        buttonLabel: 'SELECT',
        name: 'Pro',
        type: 'pro',
        price: '$249',
        discountPrice: '$208',
        isAnnual: true,
        totalForPeriod: '$2490',
        features: [
          'Onboard (Manage Access) up to 600 new clients per year',
          'Audit (View Access) up to 3000 prospects per year',
          '3 month credit rollover',
          'Overage fee: $30 per 10 extra credits',
          'Whitelabel & Embed on your website',
          'Webhooks to automate',
          'Teams: Add unlimited team members'
        ],
        isPopular: false
      },
      enterprise: {
        buttonLabel: 'BOOK A DEMO',
        name: 'Enterprise',
        type: 'enterprise',
        price: 'Talk to us',
        discountPrice: 'Talk to us',
        isAnnual: true,
        totalForPeriod: 'Talk to us',
        features: [
          'Onboard (Manage Access) a custom amount of new clients',
          'Custom amount of View Access credits (for auditing)',
          'Custom amount of credit rollover',
          'Overage Fee: custom amount',
          'Whitelabel & Embed on your website',
          'Webhooks to automate',
          'Teams: Add unlimited team members',
          'API access',
          'Other Custom integrations'
        ],
        isPopular: false
      }
    }
  });
  selectedPeriodTiers = computed(() => {
    return this.mockTiers()[this.billingPeriod()];
  });
  selectedPeriodTiersArray = computed(() => {
    return Object.values(this.selectedPeriodTiers());
  });

  billingPeriodChanged($event: MatSlideToggleChange): void {
    const value = $event.checked ? 'annual' : 'monthly';
    this.billingPeriod.set(value);
  }
}
