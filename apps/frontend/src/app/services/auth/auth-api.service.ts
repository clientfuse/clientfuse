import { Injectable } from '@angular/core';
import { ENDPOINTS } from '@connectly/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  loginWithGoogle() {
    window.location.href = `${environment.API_URL}/${ENDPOINTS.auth.root}/${ENDPOINTS.auth.google.root}`;
  }

  loginWithFacebook() {
    window.location.href = `${environment.API_URL}/${ENDPOINTS.auth.root}/${ENDPOINTS.auth.facebook.root}`;
  }

}
