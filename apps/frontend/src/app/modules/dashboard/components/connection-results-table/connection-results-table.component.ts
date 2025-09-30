import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccessType, FacebookServiceType, IGrantAccessResponse, TConnectionResultResponse, TPlatformNamesKeys } from '@clientfuse/models';
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

interface ConnectionResultRow {
  id: string;
  connectionTime: Date;
  accessType: AccessType;
  connectionLink: string;
  platforms: TPlatformNamesKeys[];
  grantedAccesses: IGrantAccessResponse[];
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
    return this.results().map((result): ConnectionResultRow => ({
      id: result._id,
      connectionTime: result.createdAt,
      accessType: result.accessType,
      connectionLink: result.connectionLinkId,
      platforms: this.detectPlatforms(result),
      grantedAccesses: this.getAllGrantedAccesses(result)
    }));
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
}
