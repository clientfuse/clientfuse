import { inject, Injectable } from '@angular/core';
import { IResponse, IUserResponse, LocalStorageKey } from '@clientfuse/models';
import { isNil } from 'lodash';
import { DateTime } from 'luxon';
import { finalize, Observable, of } from 'rxjs';
import { AgencyStoreService } from './agency/agency-store.service';
import { AuthStoreService } from './auth/auth-store.service';
import { ConnectionLinkStoreService } from './connection-link/connection-link-store.service';
import { ConnectionResultAgencyStoreService } from './connection-result/connection-result-agency-store.service';
import { LocalStorageService } from './local-storage.service';
import { NavigationService } from './navigation.service';
import { ProfileStoreService } from './profile/profile-store.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  private readonly agencyStoreService = inject(AgencyStoreService);
  private readonly authStoreService = inject(AuthStoreService);
  private readonly connectionLinkStoreService = inject(ConnectionLinkStoreService);
  private readonly connectionResultAgencyStoreService = inject(ConnectionResultAgencyStoreService);
  private readonly navigationService = inject(NavigationService);
  private readonly profileStoreService = inject(ProfileStoreService);

  start(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const hasToken = LocalStorageService.getItem(LocalStorageKey.ACCESS_TOKEN) !== null;
        const profile$: Observable<IResponse<IUserResponse> | null> = hasToken ? this.profileStoreService.getProfile$() : of(null);
        this.navigationService.observeUrl().subscribe();

        this.authStoreService.loginSuccess$.subscribe((userId) => this.initialize(userId));

        profile$
          .pipe(finalize(() => resolve()))
          .subscribe((res) => {
            console.log(`Application initialized at ${DateTime.now().toISOTime()}`);
            if (isNil(res)) return;
            this.initialize(res.payload._id);
          });
      } catch (error) {
        console.error('Error during application initializing:', error);
        reject(error);
      }
    });
  }

  private async initialize(userId: string): Promise<void> {
    try {
      const agency = await this.agencyStoreService.getUserAgency(userId);

      if (agency?._id) {
        await this.connectionLinkStoreService.loadConnectionLinksForAgency(agency._id);
        await this.connectionResultAgencyStoreService.loadConnectionResults(agency._id);
      }

      console.log(`Post-login initialization completed for user ${userId}`);
    } catch (error) {
      console.error('Error during post-login initialization:', error);
    }
  }
}
