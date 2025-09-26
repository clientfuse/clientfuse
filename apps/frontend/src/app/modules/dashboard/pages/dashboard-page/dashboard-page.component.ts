import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { generateConnectionLinkName, TConnectionLinkBase, TConnectionLinkResponse } from '@clientfuse/models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { BadgeComponent } from '../../../../components/badge/badge.component';
import { AgencyStoreService } from '../../../../services/agency/agency-store.service';
import { ConnectionLinkStoreService } from '../../../../services/connection-link/connection-link-store.service';
import { DialogService } from '../../../../services/dialog.service';
import { SnackbarService } from '../../../../services/snackbar.service';
import {
  CustomizeAccessLinkModalComponent,
  ICustomizeAccessLinkModalData
} from '../../components/modals/customize-access-link-modal/customize-access-link-modal.component';
import {
  ISelectLinkTypeModalResult,
  SelectLinkTypeModalComponent
} from '../../components/modals/select-link-type-modal/select-link-type-modal.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ClipboardModule,
    BadgeComponent,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  private readonly dialogService = inject(DialogService);
  private readonly agencyStoreService = inject(AgencyStoreService);
  private readonly connectionLinkStoreService = inject(ConnectionLinkStoreService);
  private readonly snackbarService = inject(SnackbarService);

  readonly agency = this.agencyStoreService.agency;
  readonly connectionLinks = this.connectionLinkStoreService.connectionLinks;
  readonly defaultViewLink = this.connectionLinkStoreService.defaultViewConnectionLink;
  readonly defaultManageLink = this.connectionLinkStoreService.defaultManageConnectionLink;

  readonly manageAccessLink = computed(() => {
    const link = this.defaultManageLink();
    return this.getConnectionLink(link?._id || '');
  });
  readonly viewAccessLink = computed(() => {
    const link = this.defaultViewLink();
    return this.getConnectionLink(link?._id || '');
  });

  onCopySuccess(): void {
    this.snackbarService.success('Link copied to clipboard');
  }

  openInNewTab(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  getConnectionLink(connectionLinkId: string): string {
    return connectionLinkId ? `${environment.CLIENT_APP_URL}/connect/${connectionLinkId}` : '';
  }

  async openCustomizeAccessLinkModal(connectionLink: TConnectionLinkResponse): Promise<void> {
    if (!connectionLink) {
      this.snackbarService.error('No connection link available');
      return;
    }

    const result = await firstValueFrom(
      this.dialogService.open<CustomizeAccessLinkModalComponent, ICustomizeAccessLinkModalData>(
        CustomizeAccessLinkModalComponent,
        { connectionLink }
      ).afterClosed()
    );

    if (result) {
      this.snackbarService.success('Connection link updated successfully');
    }
  }

  async createNewConnectionLink(): Promise<void> {
    const typeResult = await firstValueFrom(
      this.dialogService.open<SelectLinkTypeModalComponent, ISelectLinkTypeModalResult>(
        SelectLinkTypeModalComponent
      ).afterClosed()
    );

    if (!typeResult) return;

    const agencyId = this.agency()?._id;
    const defaultLink = typeResult.type === 'view'
      ? this.defaultViewLink()
      : this.defaultManageLink();

    if (!agencyId || !defaultLink) {
      this.snackbarService.error('No default connection link available');
      return;
    }

    const newConnectionLink = await this.connectionLinkStoreService.createConnectionLink({
      name: generateConnectionLinkName(typeResult.type, true),
      agencyId,
      isDefault: false,
      type: typeResult.type,
      google: defaultLink.google || undefined,
      facebook: defaultLink.facebook || undefined
    } as TConnectionLinkBase);

    await this.openCustomizeAccessLinkModal(newConnectionLink);
  }

  async setAsDefaultConnectionLink(connectionLinkId: string): Promise<void> {
    await this.connectionLinkStoreService.setAsDefault(connectionLinkId);
    this.snackbarService.success('Default connection link updated');
  }

  async deleteConnectionLink(connectionLinkId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this connection link?')) {
      try {
        await this.connectionLinkStoreService.deleteConnectionLink(connectionLinkId);
        this.snackbarService.success('Connection link deleted');
      } catch (error) {
        this.snackbarService.error('Cannot delete default connection link');
      }
    }
  }
}
