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
  IFacebookConnectionDto,
  IGoogleConnectionDto,
  TAccessType,
  TConnectionLinkResponse,
  GoogleServiceType,
  FacebookServiceType
} from '@clientfuse/models';
import { ListFormatter } from '@clientfuse/utils';
import { IslandComponent } from '../../../../../components/island/island.component';
import { FacebookStoreService } from '../../../../../services/facebook/facebook-store.service';
import { GoogleStoreService } from '../../../../../services/google/google-store.service';
import { ConnectionResultStoreService } from '../../../../../services/connection-result/connection-result-store.service';
import { InstructionStepComponent } from '../instruction-step/instruction-step.component';
import { RequestDetailsComponent } from '../request-details/request-details.component';
import { getServiceDisplayName } from '../../../../../utils/platform.utils';

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
  private facebookStoreService = inject(FacebookStoreService);
  private connectionResultStore = inject(ConnectionResultStoreService);

  constructor() {
    effect(() => {
      const hasConnections = this.hasAtLeastOneConnection();
      this.connectionStatusChanged.emit(hasConnections);
    });
  }

  readonly connectionLink = input.required<TConnectionLinkResponse | null>();
  readonly agencyEmail = input<string>('');
  readonly accessType = input.required<TAccessType>();
  readonly enabledGoogleServicesNames = input.required<GoogleServiceType[]>();
  readonly enabledFacebookServicesNames = input.required<FacebookServiceType[]>();
  readonly connectionStatusChanged = output<boolean>();
  readonly metaConnectionStatus = signal<ConnectionStatus>('disconnected');
  readonly googleConnectionStatus = signal<ConnectionStatus>('disconnected');
  readonly googleConnectionData = computed(() => this.googleStoreService.connectionData());
  readonly isLoadingGoogleData = computed(() => this.googleStoreService.isLoading());
  readonly googleError = computed(() => this.googleStoreService.error());
  readonly facebookConnectionData = computed(() => this.facebookStoreService.connectionData());
  readonly isLoadingFacebookData = computed(() => this.facebookStoreService.isLoading());
  readonly facebookError = computed(() => this.facebookStoreService.error());

  readonly googleServicesText = computed(() => {
    const enabledGoogleServices = this.enabledGoogleServicesNames().map(service => getServiceDisplayName(service));
    return ListFormatter.formatItemsList(enabledGoogleServices, '');
  });

  readonly facebookServicesText = computed(() => {
    const enabledFacebookServices = this.enabledFacebookServicesNames().map(service => getServiceDisplayName(service));
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

    if (this.facebookConnectionData()) {
      this.metaConnectionStatus.set('connected');
    }

    setTimeout(() => this.connectionStatusChanged.emit(this.hasAtLeastOneConnection()), 100);
  }

  private initializeAuthService(): void {
    this.socialAuthService.authState.subscribe(async (user: SocialUser) => {
      if (user) {
        if (user.provider === FacebookLoginProvider.PROVIDER_ID) {
          await this.handleFacebookSignIn(user);
        } else if (user.provider === GoogleLoginProvider.PROVIDER_ID) {
          await this.handleGoogleSignIn(user);
        }
      } else {
        this.metaConnectionStatus.set('disconnected');
        this.googleConnectionStatus.set('disconnected');
      }
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

      // Initialize or load connection result
      const connectionLink = this.connectionLink();
      if (connectionLink) {
        const googleConnectionData = this.googleStoreService.connectionData();
        if (googleConnectionData?.user?.sub) {
          await this.connectionResultStore.loadOrCreateResult(
            'google',
            googleConnectionData.user.sub,
            connectionLink._id,
            connectionLink.agencyId,
            this.accessType()
          );
        }
      }
    } catch (error) {
      console.error('Failed to connect Google account:', error);
      this.googleConnectionStatus.set('disconnected');
    }
  }

  private async handleFacebookSignIn(user: SocialUser): Promise<void> {
    try {
      console.log('Facebook User', user);

      const connectionDto: IFacebookConnectionDto = { accessToken: user.authToken };

      await this.facebookStoreService.connectFacebook(connectionDto);
      this.metaConnectionStatus.set('connected');

      // Initialize or load connection result
      const connectionLink = this.connectionLink();
      if (connectionLink) {
        const facebookConnectionData = this.facebookStoreService.connectionData();
        if (facebookConnectionData?.user?.id) {
          await this.connectionResultStore.loadOrCreateResult(
            'facebook',
            facebookConnectionData.user.id,
            connectionLink._id,
            connectionLink.agencyId,
            this.accessType()
          );
        }
      }
    } catch (error) {
      console.error('Failed to connect Facebook account:', error);
      this.metaConnectionStatus.set('disconnected');
    }
  }

  async connectFacebook(): Promise<void> {
    this.metaConnectionStatus.set('pending');

    try {
      await this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID);
    } catch (error) {
      console.error('Facebook connection failed:', error);
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
      this.facebookStoreService.clearAll();
      await this.socialAuthService.signOut();
    } else if (provider === 'google') {
      this.googleConnectionStatus.set('disconnected');
      this.googleStoreService.clearAll();
      await this.socialAuthService.signOut();
    }
  }
}
