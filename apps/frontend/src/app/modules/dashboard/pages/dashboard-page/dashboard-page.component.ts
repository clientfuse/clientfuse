import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IAgencyResponse, TAccessType } from '@clientfuse/models';
import { firstValueFrom } from 'rxjs';
import { AgencyStoreService } from '../../../../services/agency/agency-store.service';
import { DialogService } from '../../../../services/dialog.service';
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
