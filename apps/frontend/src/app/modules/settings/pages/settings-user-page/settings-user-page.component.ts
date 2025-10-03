import {
  FacebookLoginProvider,
  GoogleLoginProvider,
  GoogleSigninButtonModule,
  SocialAuthService,
  SocialUser
} from '@abacritt/angularx-social-login';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { IFacebookConnectionDto, IGoogleConnectionDto } from '@clientfuse/models';
import { canDisconnectPlatform } from '@clientfuse/utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  FacebookSocialButtonComponent
} from '../../../../components/social-buttons/facebook-social-button/facebook-social-button.component';
import { FacebookStoreService } from '../../../../services/facebook/facebook-store.service';
import { GoogleStoreService } from '../../../../services/google/google-store.service';
import { ProfileStoreService } from '../../../../services/profile/profile-store.service';
import { SnackbarService } from '../../../../services/snackbar.service';

@UntilDestroy()
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
export class SettingsUserPageComponent implements OnInit {
  private profileStoreService = inject(ProfileStoreService);
  private googleStoreService = inject(GoogleStoreService);
  private facebookStoreService = inject(FacebookStoreService);
  private socialAuthService = inject(SocialAuthService);
  private snackbarService = inject(SnackbarService);

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

  readonly isGoogleLoading = signal<boolean>(false);
  readonly isFacebookLoading = signal<boolean>(false);

  readonly isGoogleButtonDisabled = computed(() => {
    return this.isGoogleConnected() || this.isGoogleLoading();
  });

  readonly isFacebookButtonDisabled = computed(() => {
    return this.isFacebookConnected() || this.isFacebookLoading();
  });

  readonly isGoogleDisconnectDisabled = computed(() => {
    return !this.canDisconnectPlatform() || this.isGoogleLoading();
  });

  readonly isFacebookDisconnectDisabled = computed(() => {
    return !this.canDisconnectPlatform() || this.isFacebookLoading();
  });

  ngOnInit(): void {
    this.initializeSocialAuth();
  }

  private initializeSocialAuth(): void {
    this.socialAuthService.authState
      .pipe(untilDestroyed(this))
      .subscribe(async (user: SocialUser) => {
        if (user) {
          if (user.provider === GoogleLoginProvider.PROVIDER_ID) {
            await this.handleGoogleSignIn(user);
          } else if (user.provider === FacebookLoginProvider.PROVIDER_ID) {
            await this.handleFacebookSignIn(user);
          }
        }
      });
  }

  private async handleGoogleSignIn(user: SocialUser): Promise<void> {
    if (this.isGoogleConnected()) {
      this.isGoogleLoading.set(false);
      return;
    }

    this.isGoogleLoading.set(true);

    try {
      const accessToken = await this.socialAuthService.getAccessToken(GoogleLoginProvider.PROVIDER_ID);
      const idToken = user.idToken;

      const connectionDto: IGoogleConnectionDto = { idToken, accessToken };

      await this.googleStoreService.connectGoogleInternal(connectionDto);

      this.snackbarService.success('Google account connected successfully');
    } catch (error) {
      console.error('Failed to connect Google:', error);
      this.snackbarService.error('Failed to connect Google account');
    } finally {
      this.isGoogleLoading.set(false);
    }
  }

  private async handleFacebookSignIn(user: SocialUser): Promise<void> {
    if (this.isFacebookConnected()) {
      this.isFacebookLoading.set(false);
      return;
    }

    this.isFacebookLoading.set(true);

    try {
      const connectionDto: IFacebookConnectionDto = { accessToken: user.authToken };

      await this.facebookStoreService.connectFacebookInternal(connectionDto);

      this.snackbarService.success('Facebook account connected successfully');
    } catch (error) {
      console.error('Failed to connect Facebook:', error);
      this.snackbarService.error('Failed to connect Facebook account');
    } finally {
      this.isFacebookLoading.set(false);
    }
  }

  async handleFacebookConnect(): Promise<void> {
    if (this.isFacebookLoading()) return;

    this.isFacebookLoading.set(true);

    try {
      await this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID);
    } catch (error) {
      console.error('Facebook sign-in failed:', error);
      this.isFacebookLoading.set(false);
    }
  }

  async handleFacebookDisconnect(): Promise<void> {
    if (!this.canDisconnectPlatform() || this.isFacebookLoading()) return;

    this.isFacebookLoading.set(true);

    try {
      await this.facebookStoreService.disconnectFacebookInternal();
      this.snackbarService.success('Facebook account disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect Facebook:', error);
      this.snackbarService.error('Failed to disconnect Facebook account');
    } finally {
      this.isFacebookLoading.set(false);
    }
  }

  async handleGoogleConnect(): Promise<void> {
    if (this.isGoogleLoading()) return;

    this.isGoogleLoading.set(true);

    try {
      await this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      this.isGoogleLoading.set(false);
    }
  }

  async handleGoogleDisconnect(): Promise<void> {
    if (!this.canDisconnectPlatform() || this.isGoogleLoading()) return;

    this.isGoogleLoading.set(true);

    try {
      await this.googleStoreService.disconnectGoogleInternal();
      this.snackbarService.success('Google account disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect Google:', error);
      this.snackbarService.error('Failed to disconnect Google account');
    } finally {
      this.isGoogleLoading.set(false);
    }
  }
}
