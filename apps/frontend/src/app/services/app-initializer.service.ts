import { inject, Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {

  private _localStorageService = inject(LocalStorageService);

  constructor() {
  }

  start(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        console.log(`Application initialized at ${DateTime.now().toISOTime()}`);
        resolve();
      } catch (error) {
        console.error('Error during application initializing:', error);
        reject(error);
      }
    });
  }
}
