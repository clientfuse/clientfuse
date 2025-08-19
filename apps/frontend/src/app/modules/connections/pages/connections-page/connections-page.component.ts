import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import { getAccessLinkBaseKey, IAgencyResponse, TAccessType, TGoogleAccessLinkKeys } from '@clientfuse/models';
import { ListFormatter } from '../../../../../../../../libs/utils/src/lib/core/list-formatter.utils';
import { ConnectionStoreService } from '../../../../services/connect/connection-store.service';
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

  private readonly connectionService = inject(ConnectionStoreService);
  private readonly route = inject(ActivatedRoute);

  currentStepIndex = signal(0);
  isLinear = signal(true);
  connectionSettings = signal<IAgencyResponse | null>(null);
  readonly urlSegments = toSignal(this.route.url, { initialValue: [] });
  readonly accessType = computed<TAccessType>(() => {
    const segments = this.urlSegments();
    return (segments.length > 0 ? segments[segments.length - 1].path : '') as TAccessType;
  });
  requestedPlatformsText = computed<string>(() => ListFormatter.formatItemsList(this.connectionService.requestedPlatforms(), 'No platforms requested'));
  readonly enabledGoogleServicesNames = computed<TGoogleAccessLinkKeys[]>(() => {
    const connectionSettings = this.connectionSettings();
    const googleServices = connectionSettings?.defaultAccessLink?.google;
    if (!googleServices) return [];
    const key = getAccessLinkBaseKey(this.accessType());
    return Object.keys(googleServices).filter(serviceKey => googleServices[serviceKey as TGoogleAccessLinkKeys][key]) as TGoogleAccessLinkKeys[];
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
    const connectionId = this.route.snapshot.params['connectionId'];
    this.connectionSettings.set(await this.connectionService.getConnectionSettings(connectionId));
  }

  nextStep(): void {
    const currentIndex = this.currentStepIndex();
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

  previousStep(): void {
    const currentIndex = this.currentStepIndex();
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;

      this.currentStepIndex.set(prevIndex);

      setTimeout(() => {
        if (this.stepper) {
          this.stepper.previous();
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
}
