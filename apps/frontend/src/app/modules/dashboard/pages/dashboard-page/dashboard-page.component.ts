import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IAgencyResponse, TAccessType } from '@clientfuse/models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AgencyStoreService } from '../../../../services/agency/agency-store.service';
import { DialogService } from '../../../../services/dialog.service';
import { SnackbarService } from '../../../../services/snackbar.service';
import {
  CustomizeAccessLinkModalComponent,
  ICustomizeAccessLinkModalData
} from '../../components/modals/customize-access-link-modal/customize-access-link-modal.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  private readonly dialogService = inject(DialogService);
  private readonly agencyStoreService = inject(AgencyStoreService);
  private readonly snackbarService = inject(SnackbarService);

  readonly agency = this.agencyStoreService.agency;
  readonly manageAccessLink = computed(() => {
    const agency = this.agency();
    return agency?._id 
      ? `${environment.CLIENT_APP_URL}/connect/${agency._id}/manage`
      : '';
  });
  readonly viewAccessLink = computed(() => {
    const agency = this.agency();
    return agency?._id 
      ? `${environment.CLIENT_APP_URL}/connect/${agency._id}/view`
      : '';
  });

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.snackbarService.success('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      this.snackbarService.error('Failed to copy link to clipboard');
    }
  }

  openInNewTab(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  async openCustomizeAccessLinkModal(accessType: TAccessType): Promise<void> {
    const result: IAgencyResponse | null = await firstValueFrom(
      this.dialogService.open<CustomizeAccessLinkModalComponent, ICustomizeAccessLinkModalData>(
        CustomizeAccessLinkModalComponent,
        { agency: this.agencyStoreService.agency(), accessType }
      ).afterClosed()
    );
    if (!result) return;
    await this.agencyStoreService.updateAgency(
      result._id,
      { defaultAccessLink: result.defaultAccessLink }
    );
  }
}
