import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  CONNECTION_LINK_VALIDATORS,
  FacebookServiceType,
  GoogleServiceType,
  TConnectionLinkBase,
  TConnectionLinkResponse,
  TPlatformNamesKeys
} from '@clientfuse/models';
import { cloneDeep, isEqual, set } from 'lodash';
import { ConnectionLinkStoreService } from '../../../../../services/connection-link/connection-link-store.service';
import { ProfileStoreService } from '../../../../../services/profile/profile-store.service';
import { getPlatformIcon, getServiceIcon, getServiceShortDisplayName } from '../../../../../utils';

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
    MatInputModule,
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

  form = new FormGroup({});
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(CONNECTION_LINK_VALIDATORS.NAME.MIN_LENGTH),
    Validators.maxLength(CONNECTION_LINK_VALIDATORS.NAME.MAX_LENGTH)
  ]);
  nameControlChanges = toSignal(this.nameControl.valueChanges);

  initialConnectionLink = signal<TConnectionLinkResponse | null>(null);
  connectionLink = signal<TConnectionLinkResponse | null>(null);
  isChanged = computed<boolean>(() => {
    this.nameControlChanges();
    const initial = this.initialConnectionLink();
    const current = this.connectionLink();
    return !isEqual(initial, current) || this.nameControl.value !== initial?.name;
  });

  selectedBusinessPortfolioId = signal<string | null>(null);
  businessAccounts = computed(() => {
    const profile = this.profileStoreService.profile();
    return profile?.facebook?.businessAccounts || [];
  });

  async ngOnInit() {
    const link = this.data.connectionLink;
    this.initialConnectionLink.set(cloneDeep(link));
    this.connectionLink.set(cloneDeep(link));
    this.nameControl.setValue(link.name);
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
        iconSrc: getPlatformIcon('google'),
        services: Object.keys(connectionLink.google)
          .map((key: string) => {
            const service = connectionLink.google?.[key as GoogleServiceType];

            return {
              key,
              name: getServiceShortDisplayName(key),
              email: (<any>service)?.email || (<any>service)?.emailOrId || '',
              iconSrc: getServiceIcon(key, 'google'),
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
        iconSrc: getPlatformIcon('facebook'),
        services: Object.keys(connectionLink.facebook)
          .map((key: string) => {
            const service = connectionLink.facebook?.[key as FacebookServiceType];

            return {
              key,
              name: getServiceShortDisplayName(key),
              email: service?.businessPortfolioId || '',
              iconSrc: getServiceIcon(key, 'facebook'),
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
    if (!updatedConnectionLink || this.nameControl.invalid) return;

    const updateData: Partial<TConnectionLinkBase> = {
      name: this.nameControl.value || '',
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

    Object.values(FacebookServiceType).forEach(serviceKey => {
      if (connectionLink.facebook && connectionLink.facebook[serviceKey]) {
        connectionLink.facebook[serviceKey].businessPortfolioId = portfolioId;
      }
    });

    this.connectionLink.set(connectionLink);
  }

  private initializeSelectedBusinessPortfolioId(link: TConnectionLinkResponse | null) {
    if (link?.facebook?.[FacebookServiceType.AD_ACCOUNT]?.businessPortfolioId) {
      this.selectedBusinessPortfolioId.set(link.facebook[FacebookServiceType.AD_ACCOUNT].businessPortfolioId);
    } else if (link?.facebook?.[FacebookServiceType.BUSINESS]?.businessPortfolioId) {
      this.selectedBusinessPortfolioId.set(link.facebook[FacebookServiceType.BUSINESS].businessPortfolioId);
    }
  }
}
