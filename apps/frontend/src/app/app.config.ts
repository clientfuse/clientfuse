import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { INTERCEPTORS } from './interceptors';
import { AppInitializerService } from './services/app-initializer.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    ...INTERCEPTORS,
    {
      provide: APP_INITIALIZER,
      useFactory: (appInitializerService: AppInitializerService) => () => appInitializerService.start(),
      deps: [AppInitializerService],
      multi: true
    },
    provideAnimationsAsync()
  ]
};
