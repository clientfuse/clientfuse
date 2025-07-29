import { inject, Injectable } from '@angular/core';
import { IResponse, IUserResponse, LocalStorageKey } from '@connectly/models';
import { isNil } from 'lodash';
import { DateTime } from 'luxon';
import { finalize, Observable, of } from 'rxjs';
import { AgencyStoreService } from './agency/agency-store.service';
import { LocalStorageService } from './local-storage.service';
import { NavigationService } from './navigation.service';
import { ProfileStoreService } from './profile/profile-store.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {

  private readonly agencyStoreService = inject(AgencyStoreService);
  private readonly navigationService = inject(NavigationService);
  private readonly profileStoreService = inject(ProfileStoreService);

  constructor() {
  }

  start(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const hasToken = LocalStorageService.getItem(LocalStorageKey.ACCESS_TOKEN) !== null;
        const profile$: Observable<IResponse<IUserResponse> | null> = hasToken ? this.profileStoreService.getProfile$() : of(null);
        this.navigationService.observeUrl().subscribe();
        profile$
          .pipe(finalize(() => resolve()))
          .subscribe((res) => {
            console.log(`Application initialized at ${DateTime.now().toISOTime()}`);
            if (isNil(res)) return;

            Promise.all([
              this.agencyStoreService.getUserAgency(res.payload._id)
            ]);
          });
      } catch (error) {
        console.error('Error during application initializing:', error);
        reject(error);
      }
    });
  }
}
