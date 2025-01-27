import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Provider } from '@angular/core';
import { AuthInterceptor } from './auth.interceptor';
import { ErrorMessageInterceptor } from './error-message.interceptor';
import { InvalidTokenInterceptor } from './invalid-token.interceptor';
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
  },
  {
    provide: HTTP_INTERCEPTORS,
    multi: true,
    useClass: ErrorMessageInterceptor
  },
  {
    provide: HTTP_INTERCEPTORS,
    multi: true,
    useClass: InvalidTokenInterceptor
  }
];
