import {
  ENDPOINTS,
  FacebookServiceType,
  IFacebookBaseAccessService,
  IGetEntityUsersResponse,
  IGrantAccessResponse,
  IRevokeAccessResponse,
  ServerErrorCode
} from '@clientfuse/models';
import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { Public } from '../auth/decorators/is-public.decorator';
import { GetEntityUsersQueryDto, GrantManagementAccessDto, GrantViewAccessDto, RevokeAgencyAccessDto } from './dto';
import { FacebookAdAccountAccessService } from './services/access/facebook-ad-account-access.service';
import { FacebookBusinessAccessService } from './services/access/facebook-business-access.service';
import { FacebookCatalogAccessService } from './services/access/facebook-catalog-access.service';
import { FacebookPageAccessService } from './services/access/facebook-page-acess.service';
import { FacebookPixelAccessService } from './services/access/facebook-pixel-access.service';

@Controller(`${ENDPOINTS.facebook.root}/${ENDPOINTS.facebook.accessManagement.root}`)
export class FacebookAccessController {

  private readonly serviceMap: Map<FacebookServiceType, IFacebookBaseAccessService>;

  constructor(
    private readonly facebookBusinessAccessService: FacebookBusinessAccessService,
    private readonly facebookAdAccountAccessService: FacebookAdAccountAccessService,
    private readonly facebookPageAccessService: FacebookPageAccessService,
    private readonly facebookCatalogAccessService: FacebookCatalogAccessService,
    private readonly facebookPixelAccessService: FacebookPixelAccessService
  ) {
    this.serviceMap = new Map<FacebookServiceType, IFacebookBaseAccessService>();
    this.serviceMap.set(FacebookServiceType.BUSINESS, this.facebookBusinessAccessService);
    this.serviceMap.set(FacebookServiceType.AD_ACCOUNT, this.facebookAdAccountAccessService);
    this.serviceMap.set(FacebookServiceType.PAGE, this.facebookPageAccessService);
    this.serviceMap.set(FacebookServiceType.CATALOG, this.facebookCatalogAccessService);
    this.serviceMap.set(FacebookServiceType.PIXEL, this.facebookPixelAccessService);
  }

  @Public()
  @Post(ENDPOINTS.facebook.accessManagement.grantManagementAccess)
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
      accessType: 'manage',
      entityId: dto.entityId,
      agencyIdentifier: dto.agencyIdentifier,
      linkId: result.linkId,
      message: result.message
    };
  }

  @Public()
  @Post(ENDPOINTS.facebook.accessManagement.grantViewAccess)
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
      accessType: 'view',
      entityId: dto.entityId,
      agencyIdentifier: dto.agencyIdentifier,
      linkId: result.linkId,
      message: result.message
    };
  }


  @Public()
  @Get(ENDPOINTS.facebook.accessManagement.getEntityUsers)
  async getEntityUsers(
    @Query() query: GetEntityUsersQueryDto,
    @Param('service') serviceName: FacebookServiceType,
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

    const users = await service.getEntityUsers(entityId);

    return {
      service: serviceName,
      entityId,
      users,
      totalUsers: users.length
    };
  }

  @Public()
  @Delete(ENDPOINTS.facebook.accessManagement.revokeAgencyAccess)
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

  private getService(serviceName: FacebookServiceType): IFacebookBaseAccessService | null {
    return this.serviceMap.get(serviceName) || null;
  }

  private async validateAndSetTokenCredentials(accessToken: string, serviceName: FacebookServiceType): Promise<void> {
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
