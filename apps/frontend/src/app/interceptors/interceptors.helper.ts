import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Provider } from '@angular/core';
import { AuthInterceptor } from './auth.interceptor';
import { WithCredentialsInterceptor } from './with-credentials.interceptor';

export const INTERCEPTORS: Provider[] = [
  {
    provide: HTTP_INTERCEPTORS,
    multi: true,
    useClass: WithCredentialsInterceptor
  },
  {
    provide: HTTP_INTERCEPTORS,
    multi: true,
    useClass: AuthInterceptor
  }
];
