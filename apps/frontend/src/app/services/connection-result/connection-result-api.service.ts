import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENDPOINTS, IResponse, TBaseConnectionResult, TConnectionResultFilter, TConnectionResultResponse } from '@clientfuse/models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConnectionResultApiService {
  private httpClient = inject(HttpClient);

  async create(dto: TBaseConnectionResult): Promise<IResponse<TConnectionResultResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<TConnectionResultResponse>>(
        `${environment.API_URL}/${ENDPOINTS.connectionResults.root}`,
        dto
      )
    );
  }

  async findAll(filter?: TConnectionResultFilter): Promise<IResponse<TConnectionResultResponse[]>> {
    const params: any = {};

    if (filter?.agencyId) {
      params.agencyId = filter.agencyId;
    }

    if (filter?.connectionLinkId) {
      params.connectionLinkId = filter.connectionLinkId;
    }

    if (filter?.googleUserId) {
      params.googleUserId = filter.googleUserId;
    }

    if (filter?.facebookUserId) {
      params.facebookUserId = filter.facebookUserId;
    }

    return firstValueFrom(
      this.httpClient.get<IResponse<TConnectionResultResponse[]>>(
        `${environment.API_URL}/${ENDPOINTS.connectionResults.root}`,
        { params }
      )
    );
  }

  async findOne(filter: TConnectionResultFilter): Promise<IResponse<TConnectionResultResponse>> {
    const params: any = {};

    if (filter.agencyId) {
      params.agencyId = filter.agencyId;
    }

    if (filter.connectionLinkId) {
      params.connectionLinkId = filter.connectionLinkId;
    }

    if (filter.googleUserId) {
      params.googleUserId = filter.googleUserId;
    }

    if (filter.facebookUserId) {
      params.facebookUserId = filter.facebookUserId;
    }

    try {
      return await firstValueFrom(
        this.httpClient.get<IResponse<TConnectionResultResponse>>(
          `${environment.API_URL}/${ENDPOINTS.connectionResults.root}/${ENDPOINTS.connectionResults.one}`,
          { params }
        )
      );
    } catch (error: any) {
      if (error?.status === 404) {
        return { payload: null as any, statusCode: 404 };
      }
      throw error;
    }
  }

  async findById(id: string): Promise<IResponse<TConnectionResultResponse>> {
    return firstValueFrom(
      this.httpClient.get<IResponse<TConnectionResultResponse>>(
        `${environment.API_URL}/${ENDPOINTS.connectionResults.root}/${id}`
      )
    );
  }

  async findByAgency(agencyId: string): Promise<IResponse<TConnectionResultResponse[]>> {
    return firstValueFrom(
      this.httpClient.get<IResponse<TConnectionResultResponse[]>>(
        `${environment.API_URL}/${ENDPOINTS.connectionResults.root}/${ENDPOINTS.connectionResults.byAgency}`
          .replace(':agencyId', agencyId)
      )
    );
  }

  async update(id: string, dto: Partial<TBaseConnectionResult>): Promise<IResponse<TConnectionResultResponse>> {
    return firstValueFrom(
      this.httpClient.put<IResponse<TConnectionResultResponse>>(
        `${environment.API_URL}/${ENDPOINTS.connectionResults.root}/${id}`,
        dto
      )
    );
  }

  async delete(id: string): Promise<IResponse<void>> {
    return firstValueFrom(
      this.httpClient.delete<IResponse<void>>(
        `${environment.API_URL}/${ENDPOINTS.connectionResults.root}/${id}`
      )
    );
  }
}
