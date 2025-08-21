import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  AllAccessLinkKeys,
  getAccessLinkBaseKey,
  IAccessLinkBase,
  IAgencyResponse,
  ServiceNames,
  TAccessLinkBaseKey,
  TAccessType,
  TFacebookAccessLinkKeys,
  TGoogleAccessLinkKeys,
  TPlatformNamesKeys
} from '@clientfuse/models';
import { cloneDeep, isEqual, isNil, set } from 'lodash';
import { GOOGLE_ICON_PATHS } from '../../../../../utils/icon.utils';

interface IPlatformSection {
  name: string;
  platform: TPlatformNamesKeys;
  services: TServiceAccount[];
  expanded?: boolean;
  iconSrc: string;
}

type TServiceAccount = IAccessLinkBase & {
  key: string;
  name: string;
  email: string;
  iconSrc?: string;
  platform: TPlatformNamesKeys;
}

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
  private readonly googleIconPaths = GOOGLE_ICON_PATHS;

  form = new FormGroup({});

  initialAgency = signal<IAgencyResponse | null>(cloneDeep(this.data.agency));
  agency = signal<IAgencyResponse | null>(cloneDeep(this.data.agency));
  isChanged = computed<boolean>(() => !isEqual(this.initialAgency(), this.agency()));
  sections = computed<IPlatformSection[]>(() => {
    const sections: IPlatformSection[] = [];
    const defaultAccessLink = this.data.agency?.defaultAccessLink;

    if (!defaultAccessLink) {
      return sections;
    }

    if (defaultAccessLink.google) {
      const googleSection: IPlatformSection = {
        name: 'Google Accounts',
        platform: 'google' as TPlatformNamesKeys,
        expanded: true,
        iconSrc: './assets/icons/google.svg',
        services: Object.keys(defaultAccessLink.google)
          .map((key: string) => {
            const service = defaultAccessLink.google?.[key as TGoogleAccessLinkKeys];

            return {
              key,
              name: ServiceNames[key as AllAccessLinkKeys] || key,
              email: (<any>service)?.email || (<any>service)?.emailOrId || '',
              iconSrc: this.googleIconPaths[key as TGoogleAccessLinkKeys] || '',
              isViewAccessEnabled: service?.isViewAccessEnabled || false,
              isManageAccessEnabled: service?.isManageAccessEnabled || false,
              platform: 'google' as TPlatformNamesKeys
            };
          })
          .filter((service: TServiceAccount) => service.key !== '_id' && service.email)
      };
      sections.push(googleSection);
    }

    if (defaultAccessLink.facebook) {
      const metaSection: IPlatformSection = {
        name: 'Meta Assets',
        platform: 'facebook' as TPlatformNamesKeys,
        expanded: false,
        iconSrc: './assets/icons/meta.svg',
        services: Object.keys(defaultAccessLink.facebook)
          .map((key: string) => {
            const service = defaultAccessLink.facebook?.[key as TFacebookAccessLinkKeys];

            return {
              key,
              name: ServiceNames[key as AllAccessLinkKeys] || key,
              email: service?.entityId || '',
              isViewAccessEnabled: service?.isViewAccessEnabled || false,
              isManageAccessEnabled: service?.isManageAccessEnabled || false,
              platform: 'facebook' as TPlatformNamesKeys
            };
          })
          .filter((service: TServiceAccount) => service.key !== '_id' && service.email)
      };
      sections.push(metaSection);
    }

    return sections;
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

    const fieldToChange: TAccessLinkBaseKey = getAccessLinkBaseKey(this.data.accessType);
    const fullPath = `defaultAccessLink.${service.platform}.${service.key}.${fieldToChange}`;
    set(agency, fullPath, value);
    this.agency.set(agency);
  }
}
