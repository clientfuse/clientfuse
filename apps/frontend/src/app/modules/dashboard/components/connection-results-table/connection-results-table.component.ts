import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AccessTypeNames,
  IGrantAccessResponse,
  PlatformNames,
  TAccessType,
  TConnectionResultResponse,
  TPlatformNamesKeys
} from '@clientfuse/models';
import {
  detectPlatforms,
  formatRelativeTime,
  generatePlatformDeepLink,
  getPlatformDisplayName,
  getServiceDisplayName,
  getServiceIcon
} from '@clientfuse/utils';
import { BadgeComponent } from '../../../../components/badge/badge.component';
import { UIVariant } from '../../../../models/ui.model';

interface ConnectionResultRow {
  id: string;
  connectionTime: Date;
  accessType: TAccessType;
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

  rowClicked = output<TConnectionResultResponse>();
  viewDetails = output<string>();

  expandedRows = new Set<string>();

  tableRows = computed(() => {
    return this.results().map((result): ConnectionResultRow => ({
      id: result._id,
      connectionTime: result.createdAt,
      accessType: result.accessType,
      connectionLink: result.connectionLinkId,
      platforms: detectPlatforms(result),
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
    return formatRelativeTime(date);
  }

  getAccessBadgeVariant(accessType: TAccessType): UIVariant {
    return accessType === 'view' ? 'info' : 'warning';
  }

  getAccessBadgeText(accessType: TAccessType): string {
    return AccessTypeNames[accessType] || accessType;
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
    return generatePlatformDeepLink(platform, service, entityId, businessId);
  }

  getPlatformIcon(platform: TPlatformNamesKeys): string {
    const platformIcons: Record<TPlatformNamesKeys, string> = {
      google: './assets/icons/google.svg',
      facebook: './assets/icons/meta.svg'
    };
    return platformIcons[platform] || '';
  }

  getPlatformBusinessName(result: TConnectionResultResponse, platform: TPlatformNamesKeys): string {
    // Extract business name from granted accesses
    const platformAccesses = result.grantedAccesses[platform];
    if (platformAccesses && platformAccesses.length > 0 && platformAccesses[0].agencyIdentifier) {
      // Display the identifier for all platforms
      const identifier = platformAccesses[0].agencyIdentifier;
      if (platform === 'facebook') {
        // For Facebook, show business ID with prefix
        return `Meta Business (${identifier})`;
      }
      // For Google and other platforms, show the identifier directly
      return identifier;
    }
    return getPlatformDisplayName(platform);
  }

  getBusinessId(result: TConnectionResultResponse, platform: TPlatformNamesKeys): string {
    const platformAccesses = result.grantedAccesses[platform];
    if (platformAccesses && platformAccesses.length > 0) {
      return platformAccesses[0].agencyIdentifier || '';
    }
    return '';
  }

  getSuccessIcon(): string {
    return 'check_circle';
  }

  getWarningIcon(): string {
    return 'warning';
  }

  onRowClick(result: TConnectionResultResponse): void {
    this.rowClicked.emit(result);
  }

  onViewDetails(resultId: string): void {
    this.viewDetails.emit(resultId);
  }

  getPlatformDisplayName(platform: TPlatformNamesKeys): string {
    return PlatformNames[platform];
  }

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
