import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENDPOINTS, IResponse, IUserResponse } from '@clientfuse/models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private httpClient = inject(HttpClient);

  loginWithGoogle() {
    window.location.href = `${environment.API_URL}/${ENDPOINTS.auth.root}/${ENDPOINTS.auth.google.root}`;
  }

  loginWithFacebook() {
    window.location.href = `${environment.API_URL}/${ENDPOINTS.auth.root}/${ENDPOINTS.auth.facebook.root}`;
  }

  async updateEmail(email: string): Promise<IResponse<string>> {
    return firstValueFrom(this.httpClient.post<IResponse<string>>(`${environment.API_URL}/${ENDPOINTS.auth.root}/${ENDPOINTS.auth.updateEmail}`, { email }));
  }

}
