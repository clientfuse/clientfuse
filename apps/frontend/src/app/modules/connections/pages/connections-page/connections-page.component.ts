import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { isEmpty, isNil } from 'lodash';
import { ConnectAccountsComponent } from '../components/connect-accounts/connect-accounts.component';
import { InstructionStepComponent } from '../components/instruction-step/instruction-step.component';

interface ConnectionStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

interface BusinessAccount {
  name: string;
  platforms: string[];
  requestedAccess: string[];
}

interface InstructionStep {
  stepNumber: number;
  title: string;
  description: string;
  action?: string;
  buttonText?: string;
  additionalInfo?: string;
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
    InstructionStepComponent,
    ConnectAccountsComponent
  ],
  templateUrl: './connections-page.component.html',
  styleUrl: './connections-page.component.scss'
})
export class ConnectionsPageComponent {
  currentStepIndex = signal(0);
  isLinear = signal(true);

  businessAccount: BusinessAccount = {
    name: 'Old Business',
    platforms: ['Meta', 'Google'],
    requestedAccess: ['Meta Ad Account \'Main\'']
  };

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
      description: 'Review and confirm account permissions',
      icon: 'check_circle',
      completed: false,
      active: true
    },
    {
      id: 'connected',
      title: 'Connected',
      description: 'Successfully connected to all accounts',
      icon: 'vpn_key',
      completed: false,
      active: true
    }
  ]);

  instructionSteps: InstructionStep[] = [
    {
      stepNumber: 1,
      title: 'Open Your Business Manager',
      description: 'You will already see your new partner "Old Business" added.',
      buttonText: 'OPEN BUSINESS MANAGER'
    },
    {
      stepNumber: 2,
      title: 'Assign or Share Assets',
      description: 'In your Business Manager, click on "Assign Assets" or "Share Assets" (displayed under "Old Business").'
    },
    {
      stepNumber: 3,
      title: 'Select Ad Accounts and Manage',
      description: 'Select "Ad Accounts" on the left. Choose your Ad Account(s) and switch on "Manage ad accounts".',
      additionalInfo: 'Click Save Changes'
    }
  ];

  private validateStepData(step: ConnectionStep): boolean {
    return !isEmpty(step.id) && !isNil(step.title) && !isEmpty(step.title);
  }

  onStepChange(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex >= this.connectionSteps().length) {
      return;
    }

    this.currentStepIndex.set(stepIndex);
    this.updateStepStates(stepIndex);
  }

  private updateStepStates(activeIndex: number): void {
    const steps = this.connectionSteps();
    const updatedSteps = steps.map((step, index) => ({
      ...step,
      active: index === activeIndex,
      completed: index < activeIndex
    }));

    this.connectionSteps.set(updatedSteps);
  }

  nextStep(): void {
    const currentIndex = this.currentStepIndex();
    if (currentIndex < this.connectionSteps().length - 1) {
      this.onStepChange(currentIndex + 1);
    }
  }

  previousStep(): void {
    const currentIndex = this.currentStepIndex();
    if (currentIndex > 0) {
      this.onStepChange(currentIndex - 1);
    }
  }

  openBusinessManager(): void {

  }

  onContinue(): void {
    if (this.currentStepIndex() === this.connectionSteps().length - 1) {
      this.completeConnection();
    } else {
      this.nextStep();
    }
  }

  private completeConnection(): void {
    const steps = this.connectionSteps();
    const completedSteps = steps.map(step => ({ ...step, completed: true }));
    this.connectionSteps.set(completedSteps);
  }

  resetConnection(): void {
    this.currentStepIndex.set(0);
    const resetSteps = this.connectionSteps().map((step, index) => ({
      ...step,
      completed: false,
      active: index === 0
    }));
    this.connectionSteps.set(resetSteps);
  }

  getCurrentStep(): ConnectionStep | null {
    const steps = this.connectionSteps();
    const currentIndex = this.currentStepIndex();
    return steps[currentIndex] || null;
  }

  isStepAccessible(stepIndex: number): boolean {
    if (!this.isLinear()) {
      return true;
    }

    const steps = this.connectionSteps();
    return stepIndex === 0 || steps[stepIndex - 1]?.completed === true;
  }
}
