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

  createAgency(createAgencyDto: IAgencyBase) {
    return firstValueFrom(this.httpClient.post<IResponse<IAgencyResponse>>(`${environment.API_URL}/${ENDPOINTS.agencies.root}`, createAgencyDto));
  }

  findAgencies(query: Partial<IAgencyBase> = {}) {
    return firstValueFrom(this.httpClient.get<IResponse<IAgencyResponse[]>>(`${environment.API_URL}/${ENDPOINTS.agencies.root}`, { params: query as any }));
  }

  findAgency(id: string) {
    return firstValueFrom(this.httpClient.get<IResponse<IAgencyResponse>>(`${environment.API_URL}/${ENDPOINTS.agencies.root}/${id}`));
  }

  updateAgency(id: string, updateAgencyDto: Partial<IAgencyBase>) {
    return firstValueFrom(this.httpClient.put<IResponse<IAgencyResponse>>(`${environment.API_URL}/${ENDPOINTS.agencies.root}/${id}`, updateAgencyDto));
  }

  removeAgency(id: string) {
    return firstValueFrom(this.httpClient.delete<IResponse<null>>(`${environment.API_URL}/${ENDPOINTS.agencies.root}/${id}`));
  }
}
