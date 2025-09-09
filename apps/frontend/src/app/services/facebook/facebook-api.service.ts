import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ENDPOINTS,
  FacebookServiceType,
  IFacebookConnectionDto,
  IFacebookConnectionResponse,
  IGetEntityUsersQueryDto,
  IGetEntityUsersResponse,
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
export class FacebookApiService {
  private httpClient = inject(HttpClient);

  async connectFacebook(dto: IFacebookConnectionDto): Promise<IResponse<IFacebookConnectionResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<IFacebookConnectionResponse>>(
        `${environment.API_URL}/${ENDPOINTS.facebook.root}/${ENDPOINTS.facebook.connect}`,
        dto
      )
    );
  }

  async grantManagementAccess(dto: IGrantAgencyAccessDto): Promise<IResponse<IGrantAccessResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<IGrantAccessResponse>>(
        `${environment.API_URL}/${ENDPOINTS.facebook.root}/${ENDPOINTS.facebook.accessManagement.root}/${ENDPOINTS.facebook.accessManagement.grantManagementAccess}`,
        dto
      )
    );
  }

  async grantViewAccess(dto: IGrantAgencyAccessDto): Promise<IResponse<IGrantAccessResponse>> {
    return firstValueFrom(
      this.httpClient.post<IResponse<IGrantAccessResponse>>(
        `${environment.API_URL}/${ENDPOINTS.facebook.root}/${ENDPOINTS.facebook.accessManagement.root}/${ENDPOINTS.facebook.accessManagement.grantViewAccess}`,
        dto
      )
    );
  }

  async getEntityUsers(dto: IGetEntityUsersQueryDto & {
    service: FacebookServiceType;
    entityId: string
  }): Promise<IResponse<IGetEntityUsersResponse>> {
    const url = `${environment.API_URL}/${ENDPOINTS.facebook.root}/${ENDPOINTS.facebook.accessManagement.root}/users/${dto.service}/${dto.entityId}`;
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
    const url = `${environment.API_URL}/${ENDPOINTS.facebook.root}/${ENDPOINTS.facebook.accessManagement.root}/revoke/${dto.service}/${dto.entityId}/${dto.linkId}`;
    return firstValueFrom(
      this.httpClient.delete<IResponse<IRevokeAccessResponse>>(url, { body: dto })
    );
  }
}