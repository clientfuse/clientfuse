import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  private router: Router = inject(Router);

  private previousUrl$$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  previousUrl$: Observable<string> = this.previousUrl$$;
  previousUrl = toSignal(this.previousUrl$);
  private currentUrl$$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  currentUrl$: Observable<string> = this.currentUrl$$;
  currentUrl = toSignal(this.currentUrl$);

  observeUrl() {
    return this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        tap((event) => {
          event = event as NavigationEnd;
          this.previousUrl$$.next(this.currentUrl$$.getValue());
          this.currentUrl$$.next(event.urlAfterRedirects);
        })
      );
  }

}
