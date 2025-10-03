import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { canDisconnectPlatform } from '@clientfuse/utils';
import {
  FacebookSocialButtonComponent
} from '../../../../components/social-buttons/facebook-social-button/facebook-social-button.component';
import { FacebookStoreService } from '../../../../services/facebook/facebook-store.service';
import { GoogleStoreService } from '../../../../services/google/google-store.service';
import { ProfileStoreService } from '../../../../services/profile/profile-store.service';

@Component({
  selector: 'app-settings-user-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
    FacebookSocialButtonComponent,
    GoogleSigninButtonModule
  ],
  templateUrl: './settings-user-page.component.html',
  styleUrl: './settings-user-page.component.scss'
})
export class SettingsUserPageComponent {
  private profileStoreService = inject(ProfileStoreService);
  private googleStoreService = inject(GoogleStoreService);
  private facebookStoreService = inject(FacebookStoreService);

  readonly userEmail = computed(() => this.profileStoreService.profile()?.email || '');
  readonly joinedDate = computed(() => this.profileStoreService.profile()?.createdAt);
  readonly isFacebookConnected = computed(() => this.profileStoreService.profile()?.isLoggedInWithFacebook ?? false);
  readonly isGoogleConnected = computed(() => this.profileStoreService.profile()?.isLoggedInWithGoogle ?? false);
  readonly googleAccountInfo = computed(() => {
    const profile = this.profileStoreService.profile();
    return profile?.google?.email || profile?.google?.userId || null;
  });
  readonly facebookAccountInfo = computed(() => {
    const profile = this.profileStoreService.profile();
    return profile?.facebook?.email || profile?.facebook?.userId || null;
  });
  readonly canDisconnectPlatform = computed(() => {
    const profile = this.profileStoreService.profile();
    return profile ? canDisconnectPlatform(profile) : false;
  });

  handleFacebookConnect(): void {
    console.log('Facebook connect triggered');
  }

  async handleFacebookDisconnect(): Promise<void> {
    if (!this.canDisconnectPlatform()) return;

    try {
      await this.facebookStoreService.disconnectFacebookInternal();
      console.log('Facebook disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect Facebook:', error);
    }
  }

  handleGoogleConnect(): void {
    console.log('Google connect triggered');
  }

  async handleGoogleDisconnect(): Promise<void> {
    if (!this.canDisconnectPlatform()) return;

    try {
      await this.googleStoreService.disconnectGoogleInternal();
      console.log('Google disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect Google:', error);
    }
  }
}
