import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import { AccessType, FacebookServiceType, GoogleServiceType, IAgencyResponse } from '@clientfuse/models';
import { ListFormatter } from '@clientfuse/utils';
import { AgencyApiService } from '../../../../services/agency/agency-api.service';
import { ConnectionLinkStoreService } from '../../../../services/connection-link/connection-link-store.service';
import { ConnectionResultStoreService } from '../../../../services/connection-result/connection-result-store.service';
import { FacebookStoreService } from '../../../../services/facebook/facebook-store.service';
import { GoogleStoreService } from '../../../../services/google/google-store.service';
import { getPlatformDisplayName } from '../../../../utils';
import { AccessOutcomeComponent } from '../components/access-outcome/access-outcome.component';
import { ConfirmAccessComponent } from '../components/confirm-access/confirm-access.component';
import { ConnectAccountsComponent } from '../components/connect-accounts/connect-accounts.component';

interface ConnectionStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

@Component({
  selector: 'app-connections-page',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    ConnectAccountsComponent,
    ConfirmAccessComponent,
    AccessOutcomeComponent
  ],
  templateUrl: './connections-page.component.html',
  styleUrl: './connections-page.component.scss'
})
export class ConnectionsPageComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  private readonly connectionLinkStoreService = inject(ConnectionLinkStoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly googleStoreService = inject(GoogleStoreService);
  private readonly facebookStoreService = inject(FacebookStoreService);
  private readonly connectionResultStore = inject(ConnectionResultStoreService);
  private readonly agencyApiService = inject(AgencyApiService);

  currentStepIndex = signal(0);
  isLinear = signal(true);
  connectionLink = computed(() => this.connectionLinkStoreService.currentConnectionLink());
  hasValidConnections = signal(false);
  agency = signal<IAgencyResponse | null>(null);

  agencyEmail = computed(() => this.agency()?.email || '');
  agencyDisplayName = computed(() => {
    const agency = this.agency();
    if (!agency) return '';
    return agency.whiteLabeling?.agencyName || agency.email;
  });
  agencyLogoUrl = computed(() => {
    const agency = this.agency();
    return agency?.whiteLabeling?.agencyLogo || null;
  });
  readonly accessType = computed<AccessType>(() =>
    this.connectionLink()?.type || AccessType.VIEW
  );
  requestedPlatforms = computed<string[]>(() => {
    const link = this.connectionLink();
    if (!link) return [];
    const platforms: string[] = [];
    if (link.google && Object.keys(link.google).length > 0) {
      platforms.push(getPlatformDisplayName('google'));
    }
    if (link.facebook && Object.keys(link.facebook).length > 0) {
      platforms.push(getPlatformDisplayName('facebook'));
    }
    return platforms;
  });
  requestedPlatformsText = computed<string>(() => ListFormatter.formatItemsList(this.requestedPlatforms(), 'No platforms requested'));
  readonly enabledGoogleServicesNames = computed<GoogleServiceType[]>(() => {
    const connectionLink = this.connectionLink();
    const googleServices = connectionLink?.google;
    if (!googleServices) return [];
    return Object.keys(googleServices).filter(serviceKey =>
      googleServices[serviceKey as GoogleServiceType].isEnabled
    ) as GoogleServiceType[];
  });

  readonly enabledFacebookServicesNames = computed<FacebookServiceType[]>(() => {
    const connectionLink = this.connectionLink();
    const facebookServices = connectionLink?.facebook;
    if (!facebookServices) return [];
    return Object.keys(facebookServices).filter(serviceKey => {
      const service = facebookServices[serviceKey as FacebookServiceType];
      return service.isEnabled && service.businessPortfolioId && service.businessPortfolioId.trim() !== '';
    }) as FacebookServiceType[];
  });

  readonly nextButtonText = computed<string>(() => {
    const currentIndex = this.currentStepIndex();
    if (currentIndex === 0) {
      return 'Go to Confirm Access';
    } else if (currentIndex === 1) {
      return 'Finish';
    }
    return 'Next';
  });

  readonly canProceedToStep2 = computed<boolean>(() => {
    const allAccesses = this.connectionResultStore.allGrantedAccesses();
    return allAccesses.some(access => access.success);
  });

  connectionSteps = signal<ConnectionStep[]>([
    {
      id: 'connect',
      title: 'Connect Accounts',
      description: 'Establish connection to your business accounts',
      icon: 'link',
      completed: false,
      active: true
    },
    {
      id: 'confirm',
      title: 'Confirm Access',
      description: 'Follow instructions to grant access to your accounts',
      icon: 'lock_open',
      completed: false,
      active: true
    },
    {
      id: 'connected',
      title: 'Check Outcome',
      description: 'Verify connection status and access',
      icon: 'diagnosis',
      completed: false,
      active: true
    }
  ]);

  async ngOnInit(): Promise<void> {
    const connectionLinkId = this.route.snapshot.params['connectionId']; // URL param is still 'connectionId'
    const connectionLink = await this.connectionLinkStoreService.loadConnectionLink(connectionLinkId);

    if (connectionLink?.agencyId) {
      try {
        const agencyResponse = await this.agencyApiService.findAgency(connectionLink.agencyId);
        this.agency.set(agencyResponse.payload);
      } catch (error) {
        console.error('Error loading agency:', error);
      }
    }
  }

  nextStep(): void {
    const currentIndex = this.currentStepIndex();

    // Check if moving from step 0 to step 1
    if (currentIndex === 0 && !this.hasValidConnections()) {
      console.warn('At least one platform must be connected before proceeding');
      return;
    }

    // Check if moving from step 1 to step 2
    if (currentIndex === 1 && !this.canProceedToStep2()) {
      console.warn('At least one successful access must be granted before proceeding to step 2');
      return;
    }

    if (currentIndex < this.connectionSteps().length - 1) {
      const nextIndex = currentIndex + 1;

      this.markStepCompleted(currentIndex);

      this.currentStepIndex.set(nextIndex);

      setTimeout(() => {
        if (this.stepper) {
          this.stepper.next();
        }
      }, 100);
    }
  }


  private markStepCompleted(stepIndex: number): void {
    const steps = this.connectionSteps();
    const updatedSteps = steps.map((step, index) =>
      index === stepIndex ? { ...step, completed: true } : step
    );
    this.connectionSteps.set(updatedSteps);
  }

  isStepAccessible(stepIndex: number): boolean {
    if (!this.isLinear()) {
      return true;
    }

    const steps = this.connectionSteps();
    return stepIndex === 0 || steps[stepIndex - 1]?.completed === true;
  }

  onConnectionStatusChanged(hasConnections: boolean): void {
    this.hasValidConnections.set(hasConnections);
  }

  onResetConnection(): void {
    this.googleStoreService.clearAll();
    this.facebookStoreService.clearAll();
    this.connectionResultStore.clearAll();
    this.currentStepIndex.set(0);
    this.hasValidConnections.set(false);

    const steps = this.connectionSteps();
    const updatedSteps = steps.map(step => ({ ...step, completed: false }));
    this.connectionSteps.set(updatedSteps);

    if (this.stepper) {
      this.stepper.selectedIndex = 0;
    }
  }
}
