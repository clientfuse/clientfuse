import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageKey } from '@connectly/models';
import { tap } from 'rxjs';
import { LocalStorageService } from '../local-storage.service';
import { ProfileStoreService } from '../profile/profile-store.service';
import { RoutesService } from '../routes.service';
import { SnackbarService } from '../snackbar.service';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthStoreService {
  private authApiService = inject(AuthApiService);
  private profileStoreService = inject(ProfileStoreService);
  private router = inject(Router);
  private routesService = inject(RoutesService);
  private snackbarService = inject(SnackbarService);

  isLoggedIn = computed(() => !!this.profileStoreService.profile()?._id);
  isLoggedOut = computed(() => !this.isLoggedIn());

  loginWithGoogle() {
    this.authApiService.loginWithGoogle();
  }

  loginWithFacebook() {
    this.authApiService.loginWithFacebook();
  }

  login(access_token: string) {
    LocalStorageService.setItem(LocalStorageKey.ACCESS_TOKEN, access_token);

    return this.profileStoreService.getProfile$()
      .pipe(
        tap(() => {
          console.log('Logged in successfully');
          void this.router.navigateByUrl(this.routesService.dashboard());
          this.snackbarService.success('Logged in successfully');
        })
      );
  }

  logout() {
    this.clearUICache();
    void this.router.navigateByUrl(this.routesService.login());
  }

  private clearUICache(): void {
    LocalStorageService.setItem(LocalStorageKey.ACCESS_TOKEN, null);
    this.profileStoreService.clearProfile();
  }
}
