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
  IGrantManagementAccessDto,
  IGrantReadOnlyAccessDto,
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

  async connectGoogle(dto: IGoogleConnectionDto): Promise<IResponse<IGoogleConnectionResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<IGoogleConnectionResponse>>(
        `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.connect}`,
        dto
      )
    );
  }

  async grantManagementAccess(dto: IGrantManagementAccessDto): Promise<IResponse<IGrantAccessResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<IGrantAccessResponse>>(
        `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/${ENDPOINTS.google.accessManagement.grantManagementAccess}`,
        dto
      )
    );
  }

  async grantReadOnlyAccess(dto: IGrantReadOnlyAccessDto): Promise<IResponse<IGrantAccessResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<IGrantAccessResponse>>(
        `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/${ENDPOINTS.google.accessManagement.grantReadonlyAccess}`,
        dto
      )
    );
  }

  async getEntityUsers(dto: IGetEntityUsersQueryDto & {
    service: GoogleServiceType;
    entityId: string
  }): Promise<IResponse<IGetEntityUsersResponse>> {
    const url = `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/users/${dto.service}/${dto.entityId}`;
    const { accessToken } = dto;
    return firstValueFrom(
      this.httpClient.get<IResponse<IGetEntityUsersResponse>>(url, { params: { accessToken } })
    );
  }

  async revokeAgencyAccess(dto: IRevokeAgencyAccessDto): Promise<IResponse<IRevokeAccessResponse>> {
    const url = `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/revoke/${dto.service}/${dto.entityId}/${dto.linkId}`;
    return firstValueFrom(
      this.httpClient.delete<IResponse<IRevokeAccessResponse>>(url, { body: dto })
    );
  }
}
