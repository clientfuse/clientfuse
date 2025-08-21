import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ENDPOINTS,
  GoogleServiceType,
  IGetAvailableServicesResponse,
  IGetEntityUsersQueryDto,
  IGetEntityUsersResponse,
  IGetUserAccountsDto,
  IGoogleConnectionDto,
  IGoogleConnectionResponse,
  IGoogleUserAccountsDataResponse,
  IGrantAccessResponse,
  IGrantCustomAccessDto,
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

  async getUserAccountsData(dto: IGetUserAccountsDto): Promise<IResponse<IGoogleUserAccountsDataResponse>> {
    return firstValueFrom(
      this.httpClient.get<IResponse<IGoogleUserAccountsDataResponse>>(
        `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.userAccountsData}`,
        { params: { userId: dto.userId } }
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

  async grantCustomAccess(dto: IGrantCustomAccessDto): Promise<IResponse<IGrantAccessResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<IGrantAccessResponse>>(
        `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/${ENDPOINTS.google.accessManagement.grantCustomAccess}`,
        dto
      )
    );
  }

  async getEntityUsers(dto: IGetEntityUsersQueryDto & {
    service: GoogleServiceType;
    entityId: string
  }): Promise<IResponse<IGetEntityUsersResponse>> {
    const url = `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/users/${dto.service}/${dto.entityId}`;
    return firstValueFrom(
      this.httpClient.get<IResponse<IGetEntityUsersResponse>>(url, { params: { userId: dto.userId } })
    );
  }

  async revokeAgencyAccess(dto: IRevokeAgencyAccessDto): Promise<IResponse<IRevokeAccessResponse>> {
    const url = `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/revoke/${dto.service}/${dto.entityId}/${dto.linkId}`;
    return firstValueFrom(
      this.httpClient.delete<IResponse<IRevokeAccessResponse>>(url, { body: dto })
    );
  }

  async getAvailableServices(): Promise<IResponse<IGetAvailableServicesResponse>> {
    return firstValueFrom(
      this.httpClient.get<IResponse<IGetAvailableServicesResponse>>(
        `${environment.API_URL}/${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}/${ENDPOINTS.google.accessManagement.getAvailableServices}`
      )
    );
  }
}
