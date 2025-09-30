import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AccessType, ENDPOINTS, IResponse, TConnectionLinkBase, TConnectionLinkResponse } from '@clientfuse/models';
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
        `${this.baseUrl}/${ENDPOINTS.connectionLinks.getOne.replace(':id', id)}`
      )
    );
  }

  async findDefaultConnectionLinks(agencyId: string, type?: AccessType): Promise<IResponse<TConnectionLinkResponse[]>> {
    const params: any = {};
    if (type) {
      params.type = type;
    }
    const response = await firstValueFrom(
      this.httpClient.get<IResponse<TConnectionLinkResponse[]>>(
        `${this.baseUrl}/${ENDPOINTS.connectionLinks.defaultByAgency.replace(':agencyId', agencyId)}`,
        { params }
      )
    );

    const payload = Array.isArray(response.payload) ? response.payload : [response.payload];
    return { ...response, payload };
  }

  updateConnectionLink(id: string, updateConnectionLinkDto: Partial<TConnectionLinkBase>) {
    return firstValueFrom(
      this.httpClient.put<IResponse<TConnectionLinkResponse>>(
        `${this.baseUrl}/${ENDPOINTS.connectionLinks.editOne.replace(':id', id)}`,
        updateConnectionLinkDto
      )
    );
  }

  setAsDefault(id: string) {
    return firstValueFrom(
      this.httpClient.put<IResponse<TConnectionLinkResponse>>(
        `${this.baseUrl}/${ENDPOINTS.connectionLinks.setDefault.replace(':id', id)}`,
        {}
      )
    );
  }

  deleteConnectionLink(id: string) {
    return firstValueFrom(
      this.httpClient.delete<IResponse<null>>(
        `${this.baseUrl}/${ENDPOINTS.connectionLinks.deleteOne.replace(':id', id)}`
      )
    );
  }
}
