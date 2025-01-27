import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IErrorResponse } from '@connectly/models';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthStoreService } from '../services/auth/auth-store.service';

@Injectable()
export class InvalidTokenInterceptor implements HttpInterceptor {

  private authStoreService = inject(AuthStoreService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const error: IErrorResponse = err.error;
          if (error.statusCode === 401) {
            this.authStoreService.logout();
          }
          return throwError(() => err);
        })
      );
  }
}
