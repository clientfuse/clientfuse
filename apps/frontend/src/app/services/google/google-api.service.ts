import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ENDPOINTS,
  GoogleServiceType,
  IGetEntityUsersQueryDto,
  IGetEntityUsersResponse,
  IGoogleConnectionDto,
  IGoogleConnectionResponse,
  IGrantAccessResponse,
  IGrantAgencyAccessDto,
  IResponse,
  IRevokeAccessResponse,
  IRevokeAgencyAccessDto
} from '@clientfuse/models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleApiService {
  private httpClient = inject(HttpClient);

  async connectGoogleExternal(dto: IGoogleConnectionDto): Promise<IResponse<IGoogleConnectionResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<IGoogleConnectionResponse>>(
        `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.connectExternal}`,
        dto
      )
    );
  }

  async grantManagementAccess(dto: IGrantAgencyAccessDto): Promise<IResponse<IGrantAccessResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<IGrantAccessResponse>>(
        `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/${ENDPOINTS.google.accessManagement.grantManagementAccess}`,
        dto
      )
    );
  }

  async grantViewAccess(dto: IGrantAgencyAccessDto): Promise<IResponse<IGrantAccessResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<IGrantAccessResponse>>(
        `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/${ENDPOINTS.google.accessManagement.grantViewAccess}`,
        dto
      )
    );
  }

  async getEntityUsers(dto: IGetEntityUsersQueryDto & {
    service: GoogleServiceType;
    entityId: string
  }): Promise<IResponse<IGetEntityUsersResponse>> {
    const url = `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/users/${dto.service}/${dto.entityId}`;
    const { accessToken, agencyId } = dto;
    const params: any = { accessToken };
    if (agencyId) {
      params.agencyId = agencyId;
    }
    return firstValueFrom(
      this.httpClient.get<IResponse<IGetEntityUsersResponse>>(url, { params })
    );
  }

  async revokeAgencyAccess(dto: IRevokeAgencyAccessDto): Promise<IResponse<IRevokeAccessResponse>> {
    const url = `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/revoke/${dto.service}/${dto.entityId}/${dto.linkId}`;
    return firstValueFrom(
      this.httpClient.delete<IResponse<IRevokeAccessResponse>>(url, { body: dto })
    );
  }

  async disconnectGoogleInternal(): Promise<IResponse<{ message: string }>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<{ message: string }>>(
        `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.disconnectInternal}`,
        {}
      )
    );
  }
}
