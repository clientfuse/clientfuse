import { CommonModule } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  GoogleServiceType,
  IGrantAccessResponse,
  ServiceNames,
  TAccessType,
  TFacebookAccessLinkKeys,
  TGoogleAccessLinkKeys
} from '@clientfuse/models';
import { BadgeComponent } from '../../../../../components/badge/badge.component';
import { IslandComponent } from '../../../../../components/island/island.component';
import { GoogleStoreService } from '../../../../../services/google/google-store.service';
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

  resetConnection = output<void>();

  private mockFacebookAccesses = signal<IGrantAccessResponse[]>([
    {
      success: true,
      service: 'ads' as GoogleServiceType,
      accessType: 'manage',
      entityId: 'act_123456789',
      agencyEmail: 'agency@example.com',
      linkId: 'fb_link_1',
      message: 'Facebook Ads Manager Account'
    },
    {
      success: true,
      service: 'analytics' as GoogleServiceType,
      accessType: 'view',
      entityId: 'page_987654321',
      agencyEmail: 'agency@example.com',
      linkId: 'fb_link_2',
      message: 'Facebook Page Insights'
    }
  ]);

  googleAccesses = computed(() => this.googleStoreService.grantedAccesses());
  facebookAccesses = computed(() => this.mockFacebookAccesses());

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
    return this.googleAccesses().length + this.facebookAccesses().length;
  });

  private groupGoogleServices(accesses: IGrantAccessResponse[]): ServiceGroup[] {
    const serviceMap = new Map<GoogleServiceType, IGrantAccessResponse[]>();

    accesses.forEach(access => {
      if (!serviceMap.has(access.service)) {
        serviceMap.set(access.service, []);
      }
      serviceMap.get(access.service)!.push(access);
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
    if (access.entityId?.startsWith('act_')) return 'facebook_ads';
    if (access.entityId?.startsWith('page_')) return 'facebook_pages';
    return 'facebook_business';
  }

  private getServiceDisplayName(service: GoogleServiceType): string {
    const serviceName = ServiceNames[service as TGoogleAccessLinkKeys];
    if (serviceName && service === 'ads') {
      return `Google ${serviceName}`;
    }
    return serviceName || service;
  }

  private getFacebookServiceDisplayName(service: string): string {
    const fbServiceKey = service.replace('facebook_', '') as TFacebookAccessLinkKeys;
    const serviceName = ServiceNames[fbServiceKey];
    return serviceName ? `Facebook ${serviceName}` : service;
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
