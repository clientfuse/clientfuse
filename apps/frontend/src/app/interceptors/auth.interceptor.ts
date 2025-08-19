import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppHeaders, LocalStorageKey } from '@clientfuse/models';
import { Observable } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token: string | null = LocalStorageService.getItem(LocalStorageKey.ACCESS_TOKEN);

    if (token) {
      request = request.clone({
        setHeaders: {
          [AppHeaders.AUTHORIZATION]: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }

}
