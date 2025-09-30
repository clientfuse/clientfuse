import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { AccessType, FacebookServiceType, GoogleServiceType, TConnectionLinkResponse } from '@clientfuse/models';
import { getAccessTypeDisplayName, getServiceDisplayName } from '../../../../../utils';

interface IServiceGroup {
  identifier: string; // email for Google, businessPortfolioId for Facebook
  services: string[]; // service names
  displayName?: string; // optional custom display name
}

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.scss'
})
export class RequestDetailsComponent {
  readonly connectionLink = input.required<TConnectionLinkResponse | null>();
  readonly agencyEmail = input<string>('');
  readonly accessType = input.required<AccessType>();
  readonly enabledGoogleServicesNames = input<GoogleServiceType[]>([]);
  readonly enabledFacebookServicesNames = input<FacebookServiceType[]>([]);

  readonly accessTypeName = computed(() =>
    getAccessTypeDisplayName(this.accessType())
  );

  private getPlatformAccountName(platformPrefix: string): string {
    const platformAccountNames: Record<string, string> = {
      'Google': 'Google Account',
      'Meta': 'Meta Business Portfolio',
      'Microsoft': 'Microsoft Account',
      'TikTok': 'TikTok Business Account',
      'LinkedIn': 'LinkedIn Business Account',
      'Twitter': 'Twitter Account',
      'Pinterest': 'Pinterest Business Account',
      'Snapchat': 'Snapchat Business Account'
    };

    return platformAccountNames[platformPrefix] || `${platformPrefix} Account`;
  }

  private groupServicesByIdentifier(
    identifierMap: Map<string, string[]>,
    enabledServicesCount: number,
    platformPrefix: string
  ): IServiceGroup[] {
    const result: IServiceGroup[] = [];
    const groupsArray = Array.from(identifierMap.entries());

    if (enabledServicesCount === 1 || (groupsArray.length === 1 && groupsArray[0][1].length === enabledServicesCount)) {
      result.push({
        identifier: groupsArray[0][0],
        services: groupsArray[0][1],
        displayName: this.getPlatformAccountName(platformPrefix)
      });
    } else {
      // Multiple identifiers - group services by identifier
      for (const [identifier, services] of groupsArray) {
        result.push({
          identifier,
          services,
          displayName: services.length > 1
            ? `${platformPrefix} ${services.join(', ')}`
            : `${platformPrefix} ${services[0]}`
        });
      }
    }

    return result;
  }

  readonly googleServiceGroups = computed<IServiceGroup[]>(() => {
    const connectionLink = this.connectionLink();
    if (!connectionLink?.google) return [];

    const enabledServices = this.enabledGoogleServicesNames();
    if (enabledServices.length === 0) return [];

    const groups = new Map<string, string[]>();

    for (const serviceKey of enabledServices) {
      const service = connectionLink.google[serviceKey];
      if (!service) continue;

      let identifier = '';
      if ('email' in service) {
        identifier = service.email;
      } else if ('emailOrId' in service) {
        identifier = service.emailOrId;
      }

      if (identifier) {
        if (!groups.has(identifier)) {
          groups.set(identifier, []);
        }
        groups.get(identifier)?.push(getServiceDisplayName(serviceKey));
      }
    }

    return this.groupServicesByIdentifier(groups, enabledServices.length, 'Google');
  });

  readonly facebookServiceGroups = computed<IServiceGroup[]>(() => {
    const connectionLink = this.connectionLink();
    if (!connectionLink?.facebook) return [];

    const enabledServices = this.enabledFacebookServicesNames();
    if (enabledServices.length === 0) return [];

    const groups = new Map<string, string[]>();

    for (const serviceKey of enabledServices) {
      const service = connectionLink.facebook[serviceKey];
      if (!service?.businessPortfolioId) continue;

      const identifier = service.businessPortfolioId;
      if (!groups.has(identifier)) {
        groups.set(identifier, []);
      }
      groups.get(identifier)?.push(getServiceDisplayName(serviceKey));
    }

    return this.groupServicesByIdentifier(groups, enabledServices.length, 'Meta');
  });
}
