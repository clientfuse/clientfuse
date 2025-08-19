import {
  FacebookLoginProvider,
  GoogleInitOptions,
  GoogleLoginProvider,
  SocialAuthServiceConfig,
  SocialLoginModule
} from '@abacritt/angularx-social-login';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { FACEBOOK_SCOPES, GOOGLE_SCOPES } from '@clientfuse/models';
import { appRoutes } from './app.routes';
import { INTERCEPTORS } from './interceptors';
import { AppInitializerService } from './services/app-initializer.service';


const GOOGLE_LOGIN_OPTIONS: GoogleInitOptions = {
  oneTapEnabled: false,
  scopes: GOOGLE_SCOPES as unknown as string[],
  prompt: 'consent'
};

const FACEBOOK_LOGIN_OPTIONS = {
  scope: FACEBOOK_SCOPES.join(','),
  return_scopes: true,
  enable_profile_selector: true
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    ...INTERCEPTORS,
    {
      provide: APP_INITIALIZER,
      useFactory: (appInitializerService: AppInitializerService) => () => appInitializerService.start(),
      deps: [AppInitializerService],
      multi: true
    },
    provideAnimationsAsync(),
    importProvidersFrom(SocialLoginModule),
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        lang: 'en',
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider('489608030343-nglssfdfekf1smq2rkckh31lqhhfiaf3.apps.googleusercontent.com', GOOGLE_LOGIN_OPTIONS)
          },
          {
            id: FacebookLoginProvider.PROVIDER_ID,
            provider: new FacebookLoginProvider('773161165226611', FACEBOOK_LOGIN_OPTIONS)
          }
        ],
        onError: (err: any) => {
          console.error('Social login error:', err);
        }
      } as SocialAuthServiceConfig
    }
  ]
};
