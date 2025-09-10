import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENDPOINTS, IResponse, TConnectionLinkBase, TConnectionLinkResponse } from '@clientfuse/models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConnectionLinkApiService {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.API_URL}/${ENDPOINTS.connectionLinks.root}`;

  createConnectionLink(createConnectionLinkDto: TConnectionLinkBase) {
    return firstValueFrom(
      this.httpClient.post<IResponse<TConnectionLinkResponse>>(
        this.baseUrl,
        createConnectionLinkDto
      )
    );
  }

  findConnectionLinks(query: { agencyId?: string } = {}) {
    return firstValueFrom(
      this.httpClient.get<IResponse<TConnectionLinkResponse[]>>(
        this.baseUrl,
        { params: query as any }
      )
    );
  }

  findConnectionLink(id: string) {
    return firstValueFrom(
      this.httpClient.get<IResponse<TConnectionLinkResponse>>(
        `${this.baseUrl}/${id}`
      )
    );
  }

  findDefaultConnectionLink(agencyId: string) {
    return firstValueFrom(
      this.httpClient.get<IResponse<TConnectionLinkResponse>>(
        `${this.baseUrl}/default/${agencyId}`
      )
    );
  }

  updateConnectionLink(id: string, updateConnectionLinkDto: Partial<TConnectionLinkBase>) {
    return firstValueFrom(
      this.httpClient.put<IResponse<TConnectionLinkResponse>>(
        `${this.baseUrl}/${id}`,
        updateConnectionLinkDto
      )
    );
  }

  setAsDefault(id: string) {
    return firstValueFrom(
      this.httpClient.put<IResponse<TConnectionLinkResponse>>(
        `${this.baseUrl}/${id}/set-default`,
        {}
      )
    );
  }

  deleteConnectionLink(id: string) {
    return firstValueFrom(
      this.httpClient.delete<IResponse<null>>(
        `${this.baseUrl}/${id}`
      )
    );
  }
}