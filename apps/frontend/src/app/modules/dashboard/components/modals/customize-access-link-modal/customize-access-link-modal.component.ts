import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IAgencyResponse, IGoogleAccessLinkBase, TGoogleAccessLinkKeys } from '@connectly/models';
import { findKeyPath } from '@connectly/utils';
import { cloneDeep, isEqual, isNil, set } from 'lodash';

interface IPlatformSection {
  name: string;
  services: TServiceAccount[];
  expanded?: boolean;
  iconSrc: string;
}

type TServiceAccount = IGoogleAccessLinkBase & {
  key: string;
  name: string;
  email: string;
  iconSrc?: string;
}

export type TAccessType = 'view' | 'manage';

export interface ICustomizeAccessLinkModalData {
  agency: IAgencyResponse | null;
  accessType: TAccessType;
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
    MatIconModule
  ],
  templateUrl: './customize-access-link-modal.component.html',
  styleUrl: './customize-access-link-modal.component.scss'
})
export class CustomizeAccessLinkModalComponent {
  private readonly dialogRef = inject(MatDialogRef<CustomizeAccessLinkModalComponent>);
  protected readonly data: ICustomizeAccessLinkModalData = inject(MAT_DIALOG_DATA);
  private readonly googleIconPaths: Record<TGoogleAccessLinkKeys, string> = {
    ads: './assets/icons/google-ads.svg',
    analytics: './assets/icons/google-analytics.svg',
    merchantCenter: './assets/icons/google-merchant-center.svg',
    myBusiness: './assets/icons/google-my-business.svg',
    searchConsole: './assets/icons/google-search-console.svg',
    tagManager: './assets/icons/google-tag-manager.svg'
  };

  form = new FormGroup({});

  initialAgency = signal<IAgencyResponse | null>(cloneDeep(this.data.agency));
  agency = signal<IAgencyResponse | null>(cloneDeep(this.data.agency));
  isChanged = computed<boolean>(() => !isEqual(this.initialAgency(), this.agency()));
  sections = computed<IPlatformSection[]>(() => {
    const googleSection: IPlatformSection = {
      name: 'Google Accounts',
      expanded: true,
      iconSrc: './assets/icons/google.svg',
      services: Object.keys(this.data.agency?.defaultAccessLink.google || {}).map((key: string) => {
        const service = this.data.agency?.defaultAccessLink.google[key as TGoogleAccessLinkKeys];

        return {
          key,
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          email: (<any>service)?.email || (<any>service)?.emailOrId || '',
          iconSrc: this.googleIconPaths[key as TGoogleAccessLinkKeys] || '',
          isViewAccessEnabled: service?.isViewAccessEnabled || false,
          isManageAccessEnabled: service?.isManageAccessEnabled || false
        };
      })
    };

    const metaSection: IPlatformSection = {
      name: 'Meta Assets',
      expanded: false,
      iconSrc: './assets/icons/meta.svg',
      services: [
        {
          key: 'facebookAds',
          name: 'Facebook Ads',
          email: this.data.agency?.email || '',
          isViewAccessEnabled: true,
          isManageAccessEnabled: true
        },
        {
          key: 'instagramBusiness',
          name: 'Instagram Business',
          email: this.data.agency?.email || '',
          isViewAccessEnabled: false,
          isManageAccessEnabled: false
        },
        {
          key: 'metaPixel',
          name: 'Meta Pixel',
          email: this.data.agency?.email || '',
          isViewAccessEnabled: true,
          isManageAccessEnabled: true
        }
      ]
    };
    return [googleSection, metaSection];
  });

  onSubmit(): void {
    this.dialogRef.close(this.agency());
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onToggleChange(event: MatSlideToggleChange, service: TServiceAccount): void {
    const value = event.checked;
    const agency = cloneDeep(this.agency());
    if (isNil(agency)) {
      console.warn('Agency data is not available');
      return;
    }

    const path = findKeyPath(agency, service.key);
    const fieldToChange: keyof IGoogleAccessLinkBase = this.data.accessType === 'view' ? 'isViewAccessEnabled' : 'isManageAccessEnabled';
    if (!path) {
      console.warn(`Path not found for key: ${service.key}`);
      return;
    }
    const fullPath = path + '.' + fieldToChange;
    set(agency, fullPath, value);
    this.agency.set(agency);
  }
}
