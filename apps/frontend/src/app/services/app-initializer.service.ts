import { inject, Injectable } from '@angular/core';
import { IResponse, IUserResponse, LocalStorageKey } from '@connectly/models';
import { DateTime } from 'luxon';
import { finalize, Observable, of } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { ProfileStoreService } from './profile/profile-store.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {

  private profileStoreService = inject(ProfileStoreService);

  constructor() {
  }

  start(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const hasToken = LocalStorageService.getItem(LocalStorageKey.ACCESS_TOKEN) !== null;
        const profile$: Observable<IResponse<IUserResponse> | null> = hasToken ? this.profileStoreService.getProfile$() : of(null);
        profile$
          .pipe(finalize(() => resolve()))
          .subscribe(() => console.log(`Application initialized at ${DateTime.now().toISOTime()}`));
      } catch (error) {
        console.error('Error during application initializing:', error);
        reject(error);
      }
    });
  }
}
