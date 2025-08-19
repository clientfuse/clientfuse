import { ENDPOINTS, ServerErrorCode } from '@clientfuse/models';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query
} from '@nestjs/common';
import { isEmpty, isNil } from 'lodash';
import { UsersService } from '../users/users.service';
import { GoogleServiceType, IGoogleBaseAccessService, ICustomAccessOptions } from '@clientfuse/models';
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
    private readonly usersService: UsersService,
    private readonly googleAnalyticsAccessService: GoogleAnalyticsAccessService,
    private readonly googleAdsAccessService: GoogleAdsAccessService,
    private readonly googleTagManagerAccessService: GoogleTagManagerAccessService,
    private readonly googleSearchConsoleAccessService: GoogleSearchConsoleAccessService,
    private readonly googleMerchantCenterAccessService: GoogleMerchantCenterAccessService,
    private readonly googleMyBusinessAccessService: GoogleMyBusinessAccessService
  ) {
    this.serviceMap = new Map<GoogleServiceType, IGoogleBaseAccessService>();
    this.serviceMap.set('analytics', this.googleAnalyticsAccessService);
    this.serviceMap.set('ads', this.googleAdsAccessService);
    this.serviceMap.set('tagManager', this.googleTagManagerAccessService);
    this.serviceMap.set('searchConsole', this.googleSearchConsoleAccessService);
    this.serviceMap.set('merchantCenter', this.googleMerchantCenterAccessService);
    this.serviceMap.set('myBusiness', this.googleMyBusinessAccessService);
  }

  @Post(ENDPOINTS.google.accessManagement.grantManagementAccess)
  async grantManagementAccess(
    @Query('userId') userId: string,
    @Body() dto: {
      service: GoogleServiceType;
      entityId: string;
      agencyEmail: string;
    }
  ) {
    await this.validateUserAndSetCredentials(userId, dto.service);

    const service = this.getService(dto.service);
    const result = await service.grantManagementAccess(dto.entityId, dto.agencyEmail);

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to grant management access');
    }

    return {
      success: true,
      service: dto.service,
      accessType: 'management',
      entityId: dto.entityId,
      agencyEmail: dto.agencyEmail,
      linkId: result.linkId,
      message: result.message
    };
  }

  @Post(ENDPOINTS.google.accessManagement.grantReadonlyAccess)
  async grantReadOnlyAccess(
    @Query('userId') userId: string,
    @Body() dto: {
      service: GoogleServiceType;
      entityId: string;
      agencyEmail: string;
    }
  ) {
    await this.validateUserAndSetCredentials(userId, dto.service);

    const service = this.getService(dto.service);
    const result = await service.grantReadOnlyAccess(dto.entityId, dto.agencyEmail);

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to grant read-only access');
    }

    return {
      success: true,
      service: dto.service,
      accessType: 'read-only',
      entityId: dto.entityId,
      agencyEmail: dto.agencyEmail,
      linkId: result.linkId,
      message: result.message
    };
  }

  @Post(ENDPOINTS.google.accessManagement.grantCustomAccess)
  async grantCustomServiceAccess(
    @Query('userId') userId: string,
    @Body() dto: {
      service: GoogleServiceType;
      options: ICustomAccessOptions;
    }
  ) {
    await this.validateUserAndSetCredentials(userId, dto.service);

    const service = this.getService(dto.service);
    const result = await service.grantCustomAccess(dto.options);

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to grant custom access');
    }

    return {
      success: true,
      service: dto.service,
      accessType: 'custom',
      entityId: dto.options.entityId,
      agencyEmail: dto.options.agencyEmail,
      linkId: result.linkId,
      message: result.message,
      customOptions: dto.options
    };
  }

  @Get(ENDPOINTS.google.accessManagement.getEntityUsers)
  async getEntityUsers(
    @Query('userId') userId: string,
    @Param('service') serviceName: GoogleServiceType,
    @Param('entityId') entityId: string
  ) {
    if (isEmpty(userId) || isEmpty(entityId)) {
      throw new BadRequestException(ServerErrorCode.INVALID_REQUEST);
    }

    const user = await this.usersService.findUser({ _id: userId });
    if (!user) {
      throw new NotFoundException(ServerErrorCode.USER_NOT_FOUND);
    }

    if (isNil(user.google?.accessToken) || isNil(user.google?.refreshToken)) {
      throw new ForbiddenException('User must be authenticated with Google');
    }

    const service = this.getService(serviceName);
    if (!service) {
      throw new BadRequestException(`Unsupported service: ${serviceName}`);
    }

    service.setCredentials({
      access_token: user.google.accessToken,
      refresh_token: user.google.refreshToken
    });

    const users = await service.getEntityUsers(entityId);

    return {
      service: serviceName,
      entityId,
      users,
      totalUsers: users.length
    };
  }

  @Delete(ENDPOINTS.google.accessManagement.revokeAgencyAccess)
  async revokeAgencyAccess(
    @Query('userId') userId: string,
    @Param('service') serviceName: GoogleServiceType,
    @Param('entityId') entityId: string,
    @Param('linkId') linkId: string
  ) {
    if (isEmpty(userId) || isEmpty(entityId) || isEmpty(linkId)) {
      throw new BadRequestException(ServerErrorCode.INVALID_REQUEST);
    }

    const user = await this.usersService.findUser({ _id: userId });
    if (!user) {
      throw new NotFoundException(ServerErrorCode.USER_NOT_FOUND);
    }

    if (isNil(user.google?.accessToken) || isNil(user.google?.refreshToken)) {
      throw new ForbiddenException('User must be authenticated with Google');
    }

    const service = this.getService(serviceName);
    if (!service) {
      throw new BadRequestException(`Unsupported service: ${serviceName}`);
    }

    service.setCredentials({
      access_token: user.google.accessToken,
      refresh_token: user.google.refreshToken
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

  @Get(ENDPOINTS.google.accessManagement.getAvailableServices)
  getAvailableServices() {
    const services = Array.from(this.serviceMap.keys()).map(serviceName => {
      const service = this.serviceMap.get(serviceName);

      return {
        name: serviceName,
        requiredScopes: service?.getRequiredScopes() || [],
        availablePermissions: service?.getAllAvailablePermissions() || [],
        defaultPermissions: service?.getDefaultAgencyPermissions() || [],
        description: this.getServiceDescription(serviceName)
      };
    });

    return {
      availableServices: services,
      totalServices: services.length
    };
  }

  private getService(serviceName: GoogleServiceType): IGoogleBaseAccessService | null {
    return this.serviceMap.get(serviceName) || null;
  }

  private getServiceDescription(serviceName: GoogleServiceType): string {
    const descriptions = {
      analytics: 'Google Analytics - Web analytics and reporting',
      ads: 'Google Ads - Online advertising platform',
      tagManager: 'Google Tag Manager - Tag management system',
      searchConsole: 'Google Search Console - Search performance monitoring',
      merchantCenter: 'Google Merchant Center - Product listings for shopping',
      myBusiness: 'Google My Business - Local business management'
    };

    return descriptions[serviceName] || 'Unknown service';
  }

  private async validateUserAndSetCredentials(userId: string, serviceName: GoogleServiceType): Promise<void> {
    if (isEmpty(userId)) {
      throw new BadRequestException(ServerErrorCode.INVALID_REQUEST);
    }

    const user = await this.usersService.findUser({ _id: userId });
    if (!user) {
      throw new NotFoundException(ServerErrorCode.USER_NOT_FOUND);
    }

    if (isNil(user.google?.accessToken) || isNil(user.google?.refreshToken)) {
      throw new ForbiddenException('User must be authenticated with Google');
    }

    const service = this.getService(serviceName);
    if (!service) {
      throw new BadRequestException(`Unsupported service: ${serviceName}`);
    }

    service.setCredentials({
      access_token: user.google.accessToken,
      refresh_token: user.google.refreshToken
    });

    const hasRequiredScopes = service.validateRequiredScopes(
      user.google.grantedScopes || []
    );

    if (!hasRequiredScopes) {
      throw new ForbiddenException(`User does not have required ${serviceName} permissions`);
    }
  }
}
