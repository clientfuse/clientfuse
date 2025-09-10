import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENDPOINTS, IAgencyBase, IAgencyResponse, IResponse } from '@clientfuse/models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AgencyApiService {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.API_URL}/${ENDPOINTS.agencies.root}`;

  createAgency(createAgencyDto: IAgencyBase) {
    return firstValueFrom(
      this.httpClient.post<IResponse<IAgencyResponse>>(
        this.baseUrl,
        createAgencyDto
      )
    );
  }

  findAgencies(query: Partial<IAgencyBase> = {}) {
    return firstValueFrom(
      this.httpClient.get<IResponse<IAgencyResponse[]>>(
        this.baseUrl,
        { params: query as any }
      )
    );
  }

  findAgency(id: string) {
    return firstValueFrom(
      this.httpClient.get<IResponse<IAgencyResponse>>(
        `${this.baseUrl}/${ENDPOINTS.agencies.getOne.replace(':id', id)}`
      )
    );
  }

  updateAgency(id: string, updateAgencyDto: Partial<IAgencyBase>) {
    return firstValueFrom(
      this.httpClient.put<IResponse<IAgencyResponse>>(
        `${this.baseUrl}/${ENDPOINTS.agencies.editOne.replace(':id', id)}`,
        updateAgencyDto
      )
    );
  }

  removeAgency(id: string) {
    return firstValueFrom(
      this.httpClient.delete<IResponse<null>>(
        `${this.baseUrl}/${ENDPOINTS.agencies.deleteOne.replace(':id', id)}`
      )
    );
  }
}
