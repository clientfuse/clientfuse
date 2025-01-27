import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { SnackbarService } from '../services/snackbar.service';

@Injectable()
export class ErrorMessageInterceptor implements HttpInterceptor {
  private snackbarService: SnackbarService = inject(SnackbarService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const message: string = err.error.message;

          if (message) {
            this.snackbarService.error(message);
          }

          return throwError(() => err);
        })
      );
  }

}
