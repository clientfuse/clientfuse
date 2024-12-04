import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENDPOINTS, IResponse, IUserResponse } from '@connectly/models';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class ProfileApiService {
  private httpClient = inject(HttpClient);

  getProfile$(): Observable<IResponse<IUserResponse>> {
    return this.httpClient.get<IResponse<IUserResponse>>(`${environment.API_URL}/${ENDPOINTS.user.root}/${ENDPOINTS.user.profile}`)
      .pipe(shareReplay(1));
  }
}
