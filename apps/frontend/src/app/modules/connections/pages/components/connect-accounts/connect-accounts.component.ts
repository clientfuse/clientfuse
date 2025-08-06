import { FacebookLoginProvider, GoogleLoginProvider, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { InstructionStepComponent } from '../instruction-step/instruction-step.component';

type ConnectionStatus = 'disconnected' | 'connected' | 'skipped';

interface RequestDetails {
  metaBusinessPortfolio: string;
  googleAccount: string;
  accessLevel: string;
}

@Component({
  selector: 'app-connect-accounts',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    InstructionStepComponent,
    MatButtonModule
  ],
  templateUrl: './connect-accounts.component.html',
  styleUrl: './connect-accounts.component.scss'
})
export class ConnectAccountsComponent {
  private socialAuthService = inject(SocialAuthService);
  private platformId = inject(PLATFORM_ID);

  readonly metaConnectionStatus = signal<ConnectionStatus>('disconnected');
  readonly googleConnectionStatus = signal<ConnectionStatus>('disconnected');
  readonly isConnecting = signal(false);
  readonly currentUser = signal<SocialUser | null>(null);

  readonly requestDetails = signal<RequestDetails>({
    metaBusinessPortfolio: 'Old Business',
    googleAccount: 'olegbespalko12@gmail.com',
    accessLevel: 'Manage'
  });

  readonly canProceed = computed(() =>
    this.metaConnectionStatus() !== 'disconnected' ||
    this.googleConnectionStatus() === 'connected'
  );

  readonly isGoogleConnected = computed(() =>
    this.googleConnectionStatus() === 'connected'
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuthService();
    }
  }

  private initializeAuthService(): void {
    this.socialAuthService.authState.subscribe((user: SocialUser) => {
      this.currentUser.set(user);

      if (user) {
        if (user.provider === FacebookLoginProvider.PROVIDER_ID) {
          this.metaConnectionStatus.set('connected');
        } else if (user.provider === GoogleLoginProvider.PROVIDER_ID) {
          this.googleConnectionStatus.set('connected');
        }
      } else {
        this.metaConnectionStatus.set('disconnected');
        this.googleConnectionStatus.set('disconnected');
      }

      this.isConnecting.set(false);
    });
  }

  async connectFacebook(): Promise<void> {
    try {
      this.isConnecting.set(true);

      const fbLoginOptions = {
        scope: 'pages_messaging,pages_messaging_subscriptions,email,pages_show_list,manage_pages,business_management',
        return_scopes: true,
        enable_profile_selector: true
      };

      await this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID, fbLoginOptions);
    } catch (error) {
      console.error('Facebook connection failed:', error);
      this.isConnecting.set(false);
    }
  }

  skipFacebook(): void {
    this.metaConnectionStatus.set('skipped');
  }

  async signInWithGoogle(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      this.isConnecting.set(true);

      const googleLoginOptions = {
        scopes: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/adwords'
      };

      await this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID, googleLoginOptions);

    } catch (error) {
      console.error('Google sign-in failed:', error);
      this.isConnecting.set(false);
    }
  }

  editConnection(provider: 'meta' | 'google'): void {
    if (provider === 'meta') {
      this.metaConnectionStatus.set('disconnected');
      this.socialAuthService.signOut();
    } else if (provider === 'google') {
      this.googleConnectionStatus.set('disconnected');
      this.socialAuthService.signOut();
    }
  }

  async signOutAll(): Promise<void> {
    try {
      await this.socialAuthService.signOut();
      this.metaConnectionStatus.set('disconnected');
      this.googleConnectionStatus.set('disconnected');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }
}
