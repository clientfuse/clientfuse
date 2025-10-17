import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ENDPOINTS,
  IResponse,
  ICreateCheckoutSessionRequest,
  ICreateCheckoutSessionResponse,
  ICreatePortalSessionRequest,
  ICreatePortalSessionResponse,
  ISubscriptionResponse,
  ISubscriptionPlan,
} from '@clientfuse/models';

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.API_URL}/${ENDPOINTS.billing.root}`;

  createCheckoutSession(dto: ICreateCheckoutSessionRequest) {
    return firstValueFrom(
      this.httpClient.post<IResponse<ICreateCheckoutSessionResponse>>(
        `${this.baseUrl}/${ENDPOINTS.billing.checkoutSession}`,
        dto
      )
    );
  }

  createPortalSession(dto: ICreatePortalSessionRequest) {
    return firstValueFrom(
      this.httpClient.post<IResponse<ICreatePortalSessionResponse>>(
        `${this.baseUrl}/${ENDPOINTS.billing.portalSession}`,
        dto
      )
    );
  }

  getSubscription() {
    return firstValueFrom(
      this.httpClient.get<IResponse<ISubscriptionResponse>>(
        `${this.baseUrl}/${ENDPOINTS.billing.subscription}`
      )
    );
  }

  getPlans() {
    return firstValueFrom(
      this.httpClient.get<IResponse<ISubscriptionPlan[]>>(
        `${this.baseUrl}/${ENDPOINTS.billing.plans}`
      )
    );
  }
}
