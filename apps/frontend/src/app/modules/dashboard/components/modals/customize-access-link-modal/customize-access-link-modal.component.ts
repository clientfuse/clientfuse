import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  AllAccessLinkKeys,
  IConnectionLinkItemBase,
  ServiceNames,
  TConnectionLink,
  TConnectionLinkResponse,
  TFacebookAccessLinkKeys,
  TGoogleAccessLinkKeys,
  TPlatformNamesKeys
} from '@clientfuse/models';
import { cloneDeep, isEqual, set } from 'lodash';
import { ConnectionLinkStoreService } from '../../../../../services/connection-link/connection-link-store.service';
import { ProfileStoreService } from '../../../../../services/profile/profile-store.service';
import { GOOGLE_ICON_PATHS } from '../../../../../utils/icon.utils';

interface IPlatformSection {
  name: string;
  platform: TPlatformNamesKeys;
  services: TServiceAccount[];
  expanded?: boolean;
  iconSrc: string;
}

type TServiceAccount = {
  key: string;
  name: string;
  email: string;
  iconSrc?: string;
  platform: TPlatformNamesKeys;
  isEnabled: boolean;
}

export interface ICustomizeAccessLinkModalData {
  connectionLink: TConnectionLinkResponse;
}

@Component({
  selector: 'app-customize-access-link-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './customize-access-link-modal.component.html',
  styleUrl: './customize-access-link-modal.component.scss'
})
export class CustomizeAccessLinkModalComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CustomizeAccessLinkModalComponent>);
  protected readonly data: ICustomizeAccessLinkModalData = inject(MAT_DIALOG_DATA);
  private readonly connectionLinkStoreService = inject(ConnectionLinkStoreService);
  private readonly profileStoreService = inject(ProfileStoreService);
  private readonly googleIconPaths = GOOGLE_ICON_PATHS;

  form = new FormGroup({});

  initialConnectionLink = signal<TConnectionLinkResponse | null>(null);
  connectionLink = signal<TConnectionLinkResponse | null>(null);
  isChanged = computed<boolean>(() => !isEqual(this.initialConnectionLink(), this.connectionLink()));

  selectedBusinessPortfolioId = signal<string | null>(null);
  businessAccounts = computed(() => {
    const profile = this.profileStoreService.profile();
    return profile?.facebook?.businessAccounts || [];
  });

  async ngOnInit() {
    const link = this.data.connectionLink;
    this.initialConnectionLink.set(cloneDeep(link));
    this.connectionLink.set(cloneDeep(link));
    this.initializeSelectedBusinessPortfolioId(link);
  }

  sections = computed<IPlatformSection[]>(() => {
    const sections: IPlatformSection[] = [];
    const connectionLink = this.connectionLink();

    if (!connectionLink) {
      return sections;
    }

    let isFirstSection = true;

    if (connectionLink.google) {
      const googleSection: IPlatformSection = {
        name: 'Google Accounts',
        platform: 'google' as TPlatformNamesKeys,
        expanded: isFirstSection,
        iconSrc: './assets/icons/google.svg',
        services: Object.keys(connectionLink.google)
          .map((key: string) => {
            const service = connectionLink.google?.[key as TGoogleAccessLinkKeys];

            return {
              key,
              name: ServiceNames[key as AllAccessLinkKeys] || key,
              email: (<any>service)?.email || (<any>service)?.emailOrId || '',
              iconSrc: this.googleIconPaths[key as TGoogleAccessLinkKeys] || '',
              isEnabled: service?.isEnabled || false,
              platform: 'google' as TPlatformNamesKeys
            };
          })
          .filter((service: TServiceAccount) => service.key !== '_id' && service.email)
      };
      sections.push(googleSection);
      isFirstSection = false;
    }

    if (connectionLink.facebook) {
      const metaSection: IPlatformSection = {
        name: 'Meta Assets',
        platform: 'facebook' as TPlatformNamesKeys,
        expanded: isFirstSection,
        iconSrc: './assets/icons/meta.svg',
        services: Object.keys(connectionLink.facebook)
          .map((key: string) => {
            const service = connectionLink.facebook?.[key as TFacebookAccessLinkKeys];

            return {
              key,
              name: ServiceNames[key as AllAccessLinkKeys] || key,
              email: service?.businessPortfolioId || '',
              isEnabled: service?.isEnabled || false,
              platform: 'facebook' as TPlatformNamesKeys
            };
          })
          .filter((service: TServiceAccount) => service.key !== '_id' && service.email)
      };
      sections.push(metaSection);
    }

    return sections;
  });

  async onSubmit(): Promise<void> {
    const updatedConnectionLink = this.connectionLink();
    if (!updatedConnectionLink) return;

    const updateData: Partial<TConnectionLink> = {
      google: updatedConnectionLink.google,
      facebook: updatedConnectionLink.facebook
    };

    await this.connectionLinkStoreService.updateConnectionLink(
      this.data.connectionLink._id,
      updateData
    );

    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onToggleChange(event: MatSlideToggleChange, service: TServiceAccount): void {
    const value = event.checked;
    const connectionLink = cloneDeep(this.connectionLink());
    if (!connectionLink) {
      console.warn('Connection link data is not available');
      return;
    }

    const fullPath = `${service.platform}.${service.key}.isEnabled`;
    set(connectionLink, fullPath, value);
    this.connectionLink.set(connectionLink);
  }

  onBusinessPortfolioChange(portfolioId: string): void {
    const connectionLink = cloneDeep(this.connectionLink());
    if (!connectionLink?.facebook) {
      return;
    }

    this.selectedBusinessPortfolioId.set(portfolioId);

    const facebookServices: TFacebookAccessLinkKeys[] = ['ads', 'business', 'pages', 'catalogs', 'pixels'];

    facebookServices.forEach(serviceKey => {
      if (connectionLink.facebook && connectionLink.facebook[serviceKey]) {
        connectionLink.facebook[serviceKey].businessPortfolioId = portfolioId;
      }
    });

    this.connectionLink.set(connectionLink);
  }

  private initializeSelectedBusinessPortfolioId(link: TConnectionLinkResponse | null) {
    if (link?.facebook?.ads?.businessPortfolioId) {
      this.selectedBusinessPortfolioId.set(link.facebook.ads.businessPortfolioId);
    } else if (link?.facebook?.business?.businessPortfolioId) {
      this.selectedBusinessPortfolioId.set(link.facebook.business.businessPortfolioId);
    }
  }
}
