import { CommonModule } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  FacebookServiceType,
  GoogleServiceType,
  IGrantAccessResponse,
  ServiceNames,
  TAccessType,
  TGoogleAccessLinkKeys
} from '@clientfuse/models';
import { BadgeComponent } from '../../../../../components/badge/badge.component';
import { IslandComponent } from '../../../../../components/island/island.component';
import { FacebookStoreService } from '../../../../../services/facebook/facebook-store.service';
import { GoogleStoreService } from '../../../../../services/google/google-store.service';
import { ConnectionResultStoreService } from '../../../../../services/connection-result/connection-result-store.service';
import { GOOGLE_ICON_PATHS } from '../../../../../utils/icon.utils';

interface ServiceGroup {
  service: GoogleServiceType;
  serviceName: string;
  iconPath?: string;
  accesses: IGrantAccessResponse[];
}

interface PlatformSection {
  platform: 'google' | 'facebook';
  platformName: string;
  platformIcon: string;
  services: ServiceGroup[];
}

@Component({
  selector: 'app-access-outcome',
  standalone: true,
  imports: [
    CommonModule,
    MatButton,
    MatIcon,
    IslandComponent,
    BadgeComponent
  ],
  templateUrl: './access-outcome.component.html',
  styleUrl: './access-outcome.component.scss'
})
export class AccessOutcomeComponent {
  private googleStoreService = inject(GoogleStoreService);
  private facebookStoreService = inject(FacebookStoreService);
  private connectionResultStore = inject(ConnectionResultStoreService);

  resetConnection = output<void>();

  googleAccesses = computed(() => this.connectionResultStore.googleGrantedAccesses());
  facebookAccesses = computed(() => this.connectionResultStore.facebookGrantedAccesses());

  platformSections = computed<PlatformSection[]>(() => {
    const sections: PlatformSection[] = [];

    const googleGroups = this.groupGoogleServices(this.googleAccesses());
    if (googleGroups.length > 0) {
      sections.push({
        platform: 'google',
        platformName: 'Google',
        platformIcon: './assets/icons/google.svg',
        services: googleGroups
      });
    }

    const facebookGroups = this.groupFacebookServices(this.facebookAccesses());
    if (facebookGroups.length > 0) {
      sections.push({
        platform: 'facebook',
        platformName: 'Meta',
        platformIcon: './assets/icons/meta.svg',
        services: facebookGroups
      });
    }

    return sections;
  });

  totalGrantedAccesses = computed(() => {
    const summary = this.connectionResultStore.getSessionSummary();
    return summary.totalGranted;
  });

  private groupGoogleServices(accesses: IGrantAccessResponse[]): ServiceGroup[] {
    const serviceMap = new Map<GoogleServiceType, IGrantAccessResponse[]>();

    accesses.forEach(access => {
      if (!serviceMap.has(access.service as GoogleServiceType)) {
        serviceMap.set(access.service as GoogleServiceType, []);
      }
      serviceMap.get(access.service as GoogleServiceType)!.push(access);
    });

    return Array.from(serviceMap.entries()).map(([service, serviceAccesses]) => ({
      service,
      serviceName: this.getServiceDisplayName(service),
      iconPath: this.getServiceIcon(service),
      accesses: serviceAccesses
    }));
  }

  private groupFacebookServices(accesses: IGrantAccessResponse[]): ServiceGroup[] {
    const serviceMap = new Map<string, IGrantAccessResponse[]>();

    accesses.forEach(access => {
      const fbService = this.mapToFacebookService(access);
      if (!serviceMap.has(fbService)) {
        serviceMap.set(fbService, []);
      }
      serviceMap.get(fbService)!.push(access);
    });

    return Array.from(serviceMap.entries()).map(([service, serviceAccesses]) => ({
      service: service as GoogleServiceType,
      serviceName: this.getFacebookServiceDisplayName(service),
      accesses: serviceAccesses
    }));
  }

  private mapToFacebookService(access: IGrantAccessResponse): string {
    // Direct service type mapping
    switch (access.service) {
      case FacebookServiceType.AD_ACCOUNT:
        return 'facebook_ads';
      case FacebookServiceType.PAGE:
        return 'facebook_pages';
      case FacebookServiceType.CATALOG:
        return 'facebook_catalogs';
      case FacebookServiceType.PIXEL:
        return 'facebook_pixels';
      default:
        return 'facebook_ads';
    }
  }

  private getServiceDisplayName(service: GoogleServiceType): string {
    const serviceName = ServiceNames[service as TGoogleAccessLinkKeys];
    return serviceName || service;
  }

  private getFacebookServiceDisplayName(service: string): string {
    const serviceMapping: Record<string, string> = {
      'facebook_ads': 'Ads',
      'facebook_pages': 'Pages',
      'facebook_catalogs': 'Catalogs',
      'facebook_pixels': 'Pixels'
    };

    return serviceMapping[service] || service;
  }

  private getServiceIcon(service: GoogleServiceType): string {
    return GOOGLE_ICON_PATHS[service as TGoogleAccessLinkKeys] || './assets/icons/google.svg';
  }

  getAccessTypeLabel(accessType: TAccessType): string {
    return accessType === 'manage' ? 'Manage Access' : 'View Access';
  }

  getAccessTypeIcon(accessType: TAccessType): string {
    return accessType === 'manage' ? 'admin_panel_settings' : 'visibility';
  }

  addMoreConnections(): void {
    this.resetConnection.emit();
  }
}
