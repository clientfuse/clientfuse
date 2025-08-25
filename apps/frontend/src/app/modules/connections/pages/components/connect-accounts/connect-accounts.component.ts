import {
  FacebookLoginProvider,
  GoogleLoginProvider,
  GoogleSigninButtonModule,
  SocialAuthService,
  SocialUser
} from '@abacritt/angularx-social-login';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, output, PLATFORM_ID, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  IAgencyResponse,
  IGoogleConnectionDto,
  ServiceNames,
  TAccessType,
  TFacebookAccessLinkKeys,
  TGoogleAccessLinkKeys
} from '@clientfuse/models';
import { ListFormatter } from '@clientfuse/utils';
import { IslandComponent } from '../../../../../components/island/island.component';
import { GoogleStoreService } from '../../../../../services/google/google-store.service';

import { InstructionStepComponent } from '../instruction-step/instruction-step.component';
import { RequestDetailsComponent } from '../request-details/request-details.component';

type ConnectionStatus = 'disconnected' | 'connected' | 'skipped' | 'pending';

@Component({
  selector: 'app-connect-accounts',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    InstructionStepComponent,
    MatButtonModule,
    GoogleSigninButtonModule,
    RequestDetailsComponent,
    IslandComponent
  ],
  templateUrl: './connect-accounts.component.html',
  styleUrl: './connect-accounts.component.scss'
})
export class ConnectAccountsComponent implements OnInit {
  private socialAuthService = inject(SocialAuthService);
  private platformId = inject(PLATFORM_ID);
  private googleStoreService = inject(GoogleStoreService);

  constructor() {
    effect(() => {
      const hasConnections = this.hasAtLeastOneConnection();
      this.connectionStatusChanged.emit(hasConnections);
    });
  }

  readonly connectionSettings = input.required<IAgencyResponse | null>();
  readonly accessType = input.required<TAccessType>();
  readonly enabledGoogleServicesNames = input.required<TGoogleAccessLinkKeys[]>();
  readonly enabledFacebookServicesNames = input.required<TFacebookAccessLinkKeys[]>();
  readonly connectionStatusChanged = output<boolean>();
  readonly metaConnectionStatus = signal<ConnectionStatus>('disconnected');
  readonly googleConnectionStatus = signal<ConnectionStatus>('disconnected');
  readonly isConnecting = signal(false);
  readonly googleConnectionData = computed(() => this.googleStoreService.connectionData());
  readonly isLoadingGoogleData = computed(() => this.googleStoreService.isLoading());
  readonly googleError = computed(() => this.googleStoreService.error());

  readonly googleServicesText = computed(() => {
    const enabledGoogleServices = this.enabledGoogleServicesNames().map(service => ServiceNames[service as keyof typeof ServiceNames] || service);
    return ListFormatter.formatItemsList(enabledGoogleServices, '');
  });

  readonly facebookServicesText = computed(() => {
    const enabledFacebookServices = this.enabledFacebookServicesNames().map(service => ServiceNames[service as keyof typeof ServiceNames] || service);
    return ListFormatter.formatItemsList(enabledFacebookServices, '');
  });

  readonly hasNoServiceRequests = computed(() => {
    return !this.facebookServicesText() && !this.googleServicesText();
  });

  readonly hasAtLeastOneConnection = computed(() => {
    const googleConnected = this.googleConnectionStatus() === 'connected';
    const metaConnected = this.metaConnectionStatus() === 'connected';
    return googleConnected || metaConnected;
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuthService();
      this.checkInitialConnectionStatus();
    }
  }

  private async checkInitialConnectionStatus(): Promise<void> {
    if (this.googleConnectionData()) {
      this.googleConnectionStatus.set('connected');
    }

    // Emit initial status after a small delay to ensure parent is ready
    setTimeout(() => {
      this.connectionStatusChanged.emit(this.hasAtLeastOneConnection());
    }, 100);
  }

  private initializeAuthService(): void {
    this.socialAuthService.authState.subscribe(async (user: SocialUser) => {
      if (user) {
        if (user.provider === FacebookLoginProvider.PROVIDER_ID) {
          console.log('Facebook User', user);
          this.metaConnectionStatus.set('connected');
        } else if (user.provider === GoogleLoginProvider.PROVIDER_ID) {
          await this.handleGoogleSignIn(user);
        }
      } else {
        this.metaConnectionStatus.set('disconnected');
        this.googleConnectionStatus.set('disconnected');
      }

      this.isConnecting.set(false);
    });
  }

  private async handleGoogleSignIn(user: SocialUser): Promise<void> {
    try {
      const accessToken = await this.socialAuthService.getAccessToken(GoogleLoginProvider.PROVIDER_ID);
      const idToken = user.idToken;

      console.log('Google User', user);

      const connectionDto: IGoogleConnectionDto = { idToken, accessToken };

      await this.googleStoreService.connectGoogle(connectionDto);
      this.googleConnectionStatus.set('connected');
    } catch (error) {
      console.error('Failed to connect Google account:', error);
      this.googleConnectionStatus.set('disconnected');
    }
  }

  async connectFacebook(): Promise<void> {
    // Set pending status immediately to prevent multiple clicks
    this.metaConnectionStatus.set('pending');

    try {
      this.isConnecting.set(true);
      await this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID);
      // Status will be set to 'connected' in the authState subscription
    } catch (error) {
      console.error('Facebook connection failed:', error);
      this.isConnecting.set(false);
      this.metaConnectionStatus.set('disconnected');
    }
  }

  skipFacebook(): void {
    this.metaConnectionStatus.set('skipped');
  }

  skipGoogle(): void {
    this.googleConnectionStatus.set('skipped');
  }

  connectGoogle(): void {
    if (this.googleConnectionStatus() === 'pending') return;
    this.googleConnectionStatus.set('pending');
  }

  async editConnection(provider: 'meta' | 'google'): Promise<void> {
    if (provider === 'meta') {
      this.metaConnectionStatus.set('disconnected');
      await this.socialAuthService.signOut();
    } else if (provider === 'google') {
      this.googleConnectionStatus.set('disconnected');
      this.googleStoreService.clearAll();
      await this.socialAuthService.signOut();
    }
  }
}
