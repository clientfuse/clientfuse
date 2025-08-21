import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import {
  AccessTypeNames,
  IAgencyResponse,
  ServiceNames,
  TAccessType,
  TFacebookAccessLinkKeys,
  TGoogleAccessLinkKeys
} from '@clientfuse/models';
import { ListFormatter } from '@clientfuse/utils';

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.scss'
})
export class RequestDetailsComponent {
  readonly connectionSettings = input.required<IAgencyResponse | null>();
  readonly accessType = input.required<TAccessType>();
  readonly enabledGoogleServicesNames = input<TGoogleAccessLinkKeys[]>([]);
  readonly enabledFacebookServicesNames = input<TFacebookAccessLinkKeys[]>([]);

  readonly accessTypeName = computed(() =>
    AccessTypeNames[this.accessType() as keyof typeof AccessTypeNames] || this.accessType()
  );

  readonly googleServicesText = computed(() => {
    const enabledGoogleServices = this.enabledGoogleServicesNames().map(
      service => ServiceNames[service as keyof typeof ServiceNames] || service
    );
    return ListFormatter.formatItemsList(enabledGoogleServices, '');
  });

  readonly facebookServicesText = computed(() => {
    const enabledFacebookServices = this.enabledFacebookServicesNames().map(
      service => ServiceNames[service as keyof typeof ServiceNames] || service
    );
    return ListFormatter.formatItemsList(enabledFacebookServices, '');
  });
}
