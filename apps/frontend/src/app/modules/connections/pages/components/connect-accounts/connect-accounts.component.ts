import {
  FacebookLoginProvider,
  GoogleLoginProvider,
  GoogleSigninButtonModule,
  SocialAuthService,
  SocialUser
} from '@abacritt/angularx-social-login';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, input, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IAgencyResponse, ServiceNames, TAccessType, TFacebookAccessLinkKeys, TGoogleAccessLinkKeys } from '@clientfuse/models';
import { ListFormatter } from '@clientfuse/utils';

import { InstructionStepComponent } from '../instruction-step/instruction-step.component';
import { RequestDetailsComponent } from '../request-details/request-details.component';

type ConnectionStatus = 'disconnected' | 'connected' | 'skipped';

@Component({
  selector: 'app-connect-accounts',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    InstructionStepComponent,
    MatButtonModule,
    GoogleSigninButtonModule,
    RequestDetailsComponent
  ],
  templateUrl: './connect-accounts.component.html',
  styleUrl: './connect-accounts.component.scss'
})
export class ConnectAccountsComponent implements OnInit {
  private socialAuthService = inject(SocialAuthService);
  private platformId = inject(PLATFORM_ID);

  readonly connectionSettings = input.required<IAgencyResponse | null>();
  readonly accessType = input.required<TAccessType>();
  readonly enabledGoogleServicesNames = input.required<TGoogleAccessLinkKeys[]>();
  readonly enabledFacebookServicesNames = input.required<TFacebookAccessLinkKeys[]>();
  readonly metaConnectionStatus = signal<ConnectionStatus>('disconnected');
  readonly googleConnectionStatus = signal<ConnectionStatus>('disconnected');
  readonly isConnecting = signal(false);
  readonly currentUser = signal<SocialUser | null>(null);

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

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuthService();
    }
  }

  private initializeAuthService(): void {
    this.socialAuthService.authState.subscribe(async (user: SocialUser) => {
      this.currentUser.set(user);

      if (user) {
        if (user.provider === FacebookLoginProvider.PROVIDER_ID) {
          console.log('Facebook User', user);
          this.metaConnectionStatus.set('connected');
        } else if (user.provider === GoogleLoginProvider.PROVIDER_ID) {
          const accessToken = await this.socialAuthService.getAccessToken(GoogleLoginProvider.PROVIDER_ID);
          console.log('User', user);
          console.log('User', user.response);
          console.log('Google Access Token:', accessToken);
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
      await this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID);
    } catch (error) {
      console.error('Facebook connection failed:', error);
      this.isConnecting.set(false);
    }
  }

  skipFacebook(): void {
    this.metaConnectionStatus.set('skipped');
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
}
