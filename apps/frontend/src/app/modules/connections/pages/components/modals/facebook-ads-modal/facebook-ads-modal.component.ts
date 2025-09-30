import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AccessType, FacebookServiceType } from '@clientfuse/models';
import { IslandComponent } from '../../../../../../components/island/island.component';
import { StatusCardComponent } from '../../../../../../components/status-card/status-card.component';
import { ConnectionResultStoreService } from '../../../../../../services/connection-result/connection-result-store.service';
import { FacebookStoreService } from '../../../../../../services/facebook/facebook-store.service';
import { SnackbarService } from '../../../../../../services/snackbar.service';
import { getAccessTypeMessageName } from '../../../../../../utils/platform.utils';
import { CommonIssuesComponent } from '../../common-issues/common-issues.component';

export interface IFacebookAdsModalData {
  adAccountName: string;
  adAccountId: string;
  adAccountBusinessId?: string;
  businessPortfolioId: string;
  accessType: AccessType;
  agencyId?: string;
}

@Component({
  selector: 'app-facebook-ads-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    IslandComponent,
    StatusCardComponent,
    CommonIssuesComponent
  ],
  templateUrl: './facebook-ads-modal.component.html',
  styleUrl: './facebook-ads-modal.component.scss'
})
export class FacebookAdsModalComponent {
  private readonly dialogRef = inject(MatDialogRef<FacebookAdsModalComponent>);
  private readonly snackbarService = inject(SnackbarService);
  private readonly facebookStoreService = inject(FacebookStoreService);
  private readonly connectionResultStore = inject(ConnectionResultStoreService);
  protected readonly data: IFacebookAdsModalData = inject(MAT_DIALOG_DATA);

  readonly isChecking = signal<boolean>(false);
  readonly accessStatus = signal<'pending' | 'granted' | 'not_granted'>('pending');
  readonly accessMessage = signal<string>('');

  openBusinessPortfolio(): void {
    const url = `https://business.facebook.com/latest/settings/partners?business_id=${this.data.adAccountBusinessId}&selected_partner_id=${this.data.businessPortfolioId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async checkAccess(): Promise<void> {
    this.isChecking.set(true);

    try {
      await this.facebookStoreService.loadEntityUsers({
        service: FacebookServiceType.AD_ACCOUNT,
        entityId: this.data.adAccountId,
        agencyId: this.data.agencyId
      });

      const entityUsers = this.facebookStoreService.entityUsers();
      if (entityUsers && entityUsers.users && entityUsers.users.length > 0) {
        const agencyUser = entityUsers.users.find(user => user.email === this.data.businessPortfolioId);
        if (agencyUser) {
          this.accessStatus.set('granted');
          const accessTypeText = getAccessTypeMessageName(this.data.accessType);
          const message = `${accessTypeText} access granted successfully!`;
          this.accessMessage.set(message);
          this.snackbarService.success(message);

          await this.connectionResultStore.addGrantedAccess('facebook', {
            success: true,
            service: FacebookServiceType.AD_ACCOUNT,
            accessType: this.data.accessType,
            entityId: this.data.adAccountId,
            agencyIdentifier: this.data.businessPortfolioId
          });

          setTimeout(() => this.dialogRef.close(true), 1500);
        } else {
          this.accessStatus.set('not_granted');
          const message = 'Access not yet granted. Please complete the steps above and click "Check Access" again.';
          this.accessMessage.set(message);
          this.snackbarService.info(message);
        }
      } else {
        this.accessStatus.set('not_granted');
        const message = 'Access not yet granted. Please complete the steps above and click "Check Access" again.';
        this.accessMessage.set(message);
        this.snackbarService.info(message);
      }
    } catch (error) {
      console.error('Failed to check access:', error);
      this.snackbarService.error('Failed to check access. Please try again.');
      this.accessStatus.set('not_granted');
      const message = 'Failed to check access. Please try again.';
      this.accessMessage.set(message);
    } finally {
      this.isChecking.set(false);
    }
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
