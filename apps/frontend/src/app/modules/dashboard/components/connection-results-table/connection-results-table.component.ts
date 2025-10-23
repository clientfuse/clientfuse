import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AccessType,
  FacebookServiceType,
  GoogleServiceType,
  IGrantAccessResponse,
  TConnectionLinkResponse,
  TConnectionResultResponse,
  TPlatformNamesKeys
} from '@clientfuse/models';
import { DateTime } from 'luxon';
import { BadgeComponent } from '../../../../components/badge/badge.component';
import {
  getAccessTypeBadgeVariant,
  getAccessTypeDisplayName,
  getPlatformDisplayName,
  getPlatformIcon,
  getServiceDisplayName,
  getServiceIcon
} from '../../../../utils';

type RequestStatus = 'granted' | 'failed' | 'not-attempted';

interface RequestedService {
  service: string;
  platform: TPlatformNamesKeys;
  identifier: string;
}

interface ConnectionResultRow {
  id: string;
  connectionTime: Date;
  accessType: AccessType;
  connectionLink: string;
  connectionLinkSnapshot: TConnectionLinkResponse | null;
  platforms: TPlatformNamesKeys[];
  grantedAccesses: IGrantAccessResponse[];
  requestedServices: RequestedService[];
  successCount: number;
  failedCount: number;
  missingCount: number;
}


@Component({
  selector: 'app-connection-results-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    BadgeComponent
  ],
  templateUrl: './connection-results-table.component.html',
  styleUrl: './connection-results-table.component.scss'
})
export class ConnectionResultsTableComponent {
  results = input<TConnectionResultResponse[]>([]);
  isLoading = input<boolean>(false);

  expandedRows = new Set<string>();

  tableRows = computed(() => {
    return this.results().map((result): ConnectionResultRow => {
      const grantedAccesses = this.getAllGrantedAccesses(result);
      const requestedServices = this.buildRequestedServicesList(result.connectionLinkSnapshot);
      const successCount = grantedAccesses.filter(a => a.success).length;
      const failedCount = grantedAccesses.filter(a => !a.success).length;
      const missingCount = this.calculateMissingCount(requestedServices, grantedAccesses);

      return {
        id: result._id,
        connectionTime: result.createdAt,
        accessType: result.accessType,
        connectionLink: result.connectionLinkId,
        connectionLinkSnapshot: result.connectionLinkSnapshot,
        platforms: this.detectPlatforms(result),
        grantedAccesses,
        requestedServices,
        successCount,
        failedCount,
        missingCount
      };
    });
  });

  toggleRow(rowId: string): void {
    if (this.expandedRows.has(rowId)) {
      this.expandedRows.delete(rowId);
    } else {
      this.expandedRows.add(rowId);
    }
  }

  isRowExpanded(rowId: string): boolean {
    return this.expandedRows.has(rowId);
  }

  formatTime(date: Date | string): string {
    const dateTime = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
    const diff = dateTime.diffNow();
    const absoluteDiff = Math.abs(diff.as('minutes'));

    if (absoluteDiff < 1) {
      return 'just now';
    } else if (absoluteDiff < 60) {
      const minutes = Math.floor(absoluteDiff);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (absoluteDiff < 1440) {
      const hours = Math.floor(absoluteDiff / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (absoluteDiff < 43200) {
      const days = Math.floor(absoluteDiff / 1440);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return dateTime.toLocaleString(DateTime.DATETIME_SHORT);
    }
  }

  getAccessBadgeVariant = getAccessTypeBadgeVariant;

  getAccessBadgeText(accessType: AccessType): string {
    return getAccessTypeDisplayName(accessType);
  }

  getServiceIcon(service: string, platform?: TPlatformNamesKeys): string {
    return getServiceIcon(service, platform);
  }

  getServiceDisplayName(service: string): string {
    return getServiceDisplayName(service);
  }

  getDeepLink(
    platform: TPlatformNamesKeys,
    service: string,
    entityId: string,
    businessId?: string
  ): string {
    if (platform === 'facebook' && businessId) {
      const serviceMap: Record<string, string> = {
        [FacebookServiceType.AD_ACCOUNT]: 'ad_accounts',
        [FacebookServiceType.PAGE]: 'pages',
        [FacebookServiceType.CATALOG]: 'product_catalogs',
        [FacebookServiceType.PIXEL]: 'events_dataset',
        [FacebookServiceType.BUSINESS]: 'businesses'
      };

      const servicePath = serviceMap[service] || service;
      const assetType = service === FacebookServiceType.PIXEL ? 'events-dataset-new' : service;

      return `https://business.facebook.com/latest/settings/${servicePath}?business_id=${businessId}&selected_asset_id=${entityId}&selected_asset_type=${assetType}`;
    }

    // For Google, we need additional parameters like ocid which are not available
    // Return a placeholder or basic URL
    return '#';
  }

  getPlatformIcon = getPlatformIcon;

  getPlatformBusinessName(result: TConnectionResultResponse, platform: TPlatformNamesKeys): string {
    const platformAccesses = result.grantedAccesses[platform];
    if (platformAccesses && platformAccesses.length > 0 && platformAccesses[0].agencyIdentifier) {
      const identifier = platformAccesses[0].agencyIdentifier;

      if (platform === 'facebook') {
        return `Meta Business (${identifier})`;
      }

      return identifier;
    }
    return '';
  }

  detectPlatforms(result: TConnectionResultResponse): TPlatformNamesKeys[] {
    const platforms: TPlatformNamesKeys[] = [];

    if (result.googleUserId) {
      platforms.push('google');
    }

    if (result.facebookUserId) {
      platforms.push('facebook');
    }

    return platforms;
  }

  getPlatformDisplayName = getPlatformDisplayName;

  private getAllGrantedAccesses(result: TConnectionResultResponse): IGrantAccessResponse[] {
    const allAccesses: IGrantAccessResponse[] = [];

    Object.values(result.grantedAccesses).forEach(platformAccesses => {
      if (Array.isArray(platformAccesses)) {
        allAccesses.push(...platformAccesses);
      }
    });

    return allAccesses;
  }

  private buildRequestedServicesList(snapshot: TConnectionLinkResponse | null): RequestedService[] {
    if (!snapshot) return [];
    const requested: RequestedService[] = [];

    const googleServicesMap: Array<{
      key: GoogleServiceType;
      identifierKey: 'email' | 'emailOrId';
    }> = [
      { key: GoogleServiceType.ADS, identifierKey: 'email' },
      { key: GoogleServiceType.ANALYTICS, identifierKey: 'email' },
      { key: GoogleServiceType.SEARCH_CONSOLE, identifierKey: 'email' },
      { key: GoogleServiceType.TAG_MANAGER, identifierKey: 'email' },
      { key: GoogleServiceType.MERCHANT_CENTER, identifierKey: 'email' },
      { key: GoogleServiceType.MY_BUSINESS, identifierKey: 'emailOrId' }
    ];

    const facebookServicesMap: FacebookServiceType[] = [
      FacebookServiceType.AD_ACCOUNT,
      FacebookServiceType.BUSINESS,
      FacebookServiceType.PAGE,
      FacebookServiceType.CATALOG,
      FacebookServiceType.PIXEL
    ];

    if (snapshot.google) {
      googleServicesMap.forEach(({ key, identifierKey }) => {
        const serviceData = snapshot.google![key];
        if (serviceData?.isEnabled) {
          requested.push({
            service: key,
            platform: 'google',
            identifier: (serviceData as any)[identifierKey]
          });
        }
      });
    }

    if (snapshot.facebook) {
      facebookServicesMap.forEach(key => {
        const serviceData = snapshot.facebook![key];
        if (serviceData?.isEnabled) {
          requested.push({
            service: key,
            platform: 'facebook',
            identifier: serviceData.businessPortfolioId || ''
          });
        }
      });
    }

    return requested;
  }

  private calculateMissingCount(
    requestedServices: RequestedService[],
    grantedAccesses: IGrantAccessResponse[]
  ): number {
    if (requestedServices.length === 0) return 0;

    const missingServices = requestedServices.filter(requested => {
      const wasAttempted = grantedAccesses.some(granted => granted.service === requested.service);
      return !wasAttempted;
    });

    return missingServices.length;
  }

  getRequestStatus(row: ConnectionResultRow, requestedService: RequestedService): RequestStatus {
    const grantResult = row.grantedAccesses.find(access => access.service === requestedService.service);

    if (!grantResult) {
      return 'not-attempted';
    }

    return grantResult.success ? 'granted' : 'failed';
  }

  getRequestStatusTitle(status: RequestStatus): string {
    const STATUS_TITLES: Record<RequestStatus, string> = {
      granted: 'Granted',
      failed: 'Failed',
      'not-attempted': 'Not Attempted'
    };
    return STATUS_TITLES[status];
  }

  getRequestStatusIcon(status: RequestStatus): string {
    const STATUS_ICONS: Record<RequestStatus, string> = {
      granted: 'check_circle',
      failed: 'warning',
      'not-attempted': 'remove_circle_outline'
    };
    return STATUS_ICONS[status];
  }

  getRequestStatusClass(status: RequestStatus): string {
    const STATUS_CLASSES: Record<RequestStatus, string> = {
      granted: 'status-granted',
      failed: 'status-failed',
      'not-attempted': 'status-not-attempted'
    };
    return STATUS_CLASSES[status];
  }

  getErrorMessage(row: ConnectionResultRow, requestedService: RequestedService): string | undefined {
    const grantResult = row.grantedAccesses.find(access => access.service === requestedService.service);
    return grantResult?.error;
  }
}
