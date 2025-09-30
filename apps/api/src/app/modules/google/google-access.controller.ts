import {
  AccessType,
  ENDPOINTS,
  GoogleServiceType,
  IGetEntityUsersResponse,
  IGoogleBaseAccessService,
  IGrantAccessResponse,
  IRevokeAccessResponse,
  ServerErrorCode
} from '@clientfuse/models';
import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { Public } from '../auth/decorators/is-public.decorator';
import {
  GetEntityUsersQueryDto,
  GrantManagementAccessDto,
  GrantViewAccessDto,
  RevokeAgencyAccessDto
} from './dto';
import { GoogleAdsAccessService } from './services/access/google-ads-access.service';
import { GoogleAnalyticsAccessService } from './services/access/google-analytics-access.service';
import { GoogleMerchantCenterAccessService } from './services/access/google-merchant-center-access.service';
import { GoogleMyBusinessAccessService } from './services/access/google-my-business-access.service';
import { GoogleSearchConsoleAccessService } from './services/access/google-search-console-access.service';
import { GoogleTagManagerAccessService } from './services/access/google-tag-manager-access.service';

@Controller(`${ENDPOINTS.google.root}/${ENDPOINTS.google.accessManagement.root}`)
export class GoogleAccessController {

  private readonly serviceMap: Map<GoogleServiceType, IGoogleBaseAccessService>;

  constructor(
    private readonly googleAnalyticsAccessService: GoogleAnalyticsAccessService,
    private readonly googleAdsAccessService: GoogleAdsAccessService,
    private readonly googleTagManagerAccessService: GoogleTagManagerAccessService,
    private readonly googleSearchConsoleAccessService: GoogleSearchConsoleAccessService,
    private readonly googleMerchantCenterAccessService: GoogleMerchantCenterAccessService,
    private readonly googleMyBusinessAccessService: GoogleMyBusinessAccessService
  ) {
    this.serviceMap = new Map<GoogleServiceType, IGoogleBaseAccessService>();
    this.serviceMap.set(GoogleServiceType.ANALYTICS, this.googleAnalyticsAccessService);
    this.serviceMap.set(GoogleServiceType.ADS, this.googleAdsAccessService);
    this.serviceMap.set(GoogleServiceType.TAG_MANAGER, this.googleTagManagerAccessService);
    this.serviceMap.set(GoogleServiceType.SEARCH_CONSOLE, this.googleSearchConsoleAccessService);
    this.serviceMap.set(GoogleServiceType.MERCHANT_CENTER, this.googleMerchantCenterAccessService);
    this.serviceMap.set(GoogleServiceType.MY_BUSINESS, this.googleMyBusinessAccessService);
  }

  @Public()
  @Post(ENDPOINTS.google.accessManagement.grantManagementAccess)
  async grantManagementAccess(@Body() dto: GrantManagementAccessDto): Promise<IGrantAccessResponse> {
    await this.validateAndSetTokenCredentials(dto.accessToken, dto.service);

    const service = this.getService(dto.service);
    const result = await service.grantManagementAccess(dto.entityId, dto.agencyIdentifier);

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to grant management access');
    }

    return {
      success: true,
      service: dto.service,
      accessType: AccessType.MANAGE,
      entityId: dto.entityId,
      agencyIdentifier: dto.agencyIdentifier,
      linkId: result.linkId,
      message: result.message
    };
  }

  @Public()
  @Post(ENDPOINTS.google.accessManagement.grantViewAccess)
  async grantViewAccess(@Body() dto: GrantViewAccessDto): Promise<IGrantAccessResponse> {
    await this.validateAndSetTokenCredentials(dto.accessToken, dto.service);

    const service = this.getService(dto.service);
    const result = await service.grantViewAccess(dto.entityId, dto.agencyIdentifier);

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to grant view access');
    }

    return {
      success: true,
      service: dto.service,
      accessType: AccessType.VIEW,
      entityId: dto.entityId,
      agencyIdentifier: dto.agencyIdentifier,
      linkId: result.linkId,
      message: result.message
    };
  }


  @Public()
  @Get(ENDPOINTS.google.accessManagement.getEntityUsers)
  async getEntityUsers(
    @Query() query: GetEntityUsersQueryDto,
    @Param('service') serviceName: GoogleServiceType,
    @Param('entityId') entityId: string
  ): Promise<IGetEntityUsersResponse> {
    if (isEmpty(query.accessToken) || isEmpty(entityId)) {
      throw new BadRequestException(ServerErrorCode.INVALID_REQUEST);
    }

    const service = this.getService(serviceName);
    if (!service) {
      throw new BadRequestException(`Unsupported service: ${serviceName}`);
    }

    service.setCredentials({
      access_token: query.accessToken
    });

    const users = await service.getEntityUsers({ entityId, agencyId: query.agencyId });

    return {
      service: serviceName,
      entityId,
      users,
      totalUsers: users.length
    };
  }

  @Public()
  @Delete(ENDPOINTS.google.accessManagement.revokeAgencyAccess)
  async revokeAgencyAccess(@Body() dto: RevokeAgencyAccessDto): Promise<IRevokeAccessResponse> {
    const { accessToken, service: serviceName, entityId, linkId } = dto;
    if (isEmpty(accessToken) || isEmpty(entityId) || isEmpty(linkId)) {
      throw new BadRequestException(ServerErrorCode.INVALID_REQUEST);
    }

    const service = this.getService(serviceName);
    if (!service) {
      throw new BadRequestException(`Unsupported service: ${serviceName}`);
    }

    service.setCredentials({
      access_token: accessToken
    });

    const result = await service.revokeUserAccess(entityId, linkId);

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to revoke access');
    }

    return {
      success: true,
      service: serviceName,
      message: result.message
    };
  }

  private getService(serviceName: GoogleServiceType): IGoogleBaseAccessService | null {
    return this.serviceMap.get(serviceName) || null;
  }

  private async validateAndSetTokenCredentials(accessToken: string, serviceName: GoogleServiceType): Promise<void> {
    if (isEmpty(accessToken)) {
      throw new BadRequestException(ServerErrorCode.INVALID_REQUEST);
    }

    const service = this.getService(serviceName);
    if (!service) {
      throw new BadRequestException(`Unsupported service: ${serviceName}`);
    }

    service.setCredentials({
      access_token: accessToken
    });
  }
}
