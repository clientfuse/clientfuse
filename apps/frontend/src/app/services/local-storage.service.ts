import { Injectable } from '@angular/core';
import { fromEvent, Observable, Subject, tap } from 'rxjs';

interface IChangedKey {
  key: string | null;
  newValue: string;
  oldValue: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private _changedKey$$: Subject<IChangedKey> = new Subject();
  changedKey$: Observable<IChangedKey> = this._changedKey$$;

  constructor() {
  }

  listenToStorageChanges(): Observable<StorageEvent> {
    return fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        tap((event: StorageEvent) => {
          this._changedKey$$.next({
            key: event.key,
            newValue: LocalStorageService.parse(event.newValue),
            oldValue: LocalStorageService.parse(event.oldValue)
          });
        })
      );
  }

  static setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving to localStorage: ${error}`);
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? this.parse(item) : null;
    } catch (error) {
      console.error(`Error getting data from localStorage: ${error}`);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data from localStorage: ${error}`);
    }
  }

  static parse<T>(value: string | null): T {
    let parsedValue;

    try {
      parsedValue = JSON.parse(value as string);
    } catch {
      parsedValue = value;
    }

    return parsedValue;
  }
}
