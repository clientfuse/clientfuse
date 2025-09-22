import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FacebookServiceType, TAccessType } from '@clientfuse/models';
import { CommonIssuesComponent } from '../../common-issues/common-issues.component';
import { IslandComponent } from '../../../../../../components/island/island.component';
import { StatusCardComponent } from '../../../../../../components/status-card/status-card.component';
import { FacebookStoreService } from '../../../../../../services/facebook/facebook-store.service';
import { SnackbarService } from '../../../../../../services/snackbar.service';

export interface IFacebookPixelModalData {
  pixelName: string;
  pixelId: string;
  businessPortfolioId: string;
  accessType: TAccessType;
  agencyId?: string;
}

@Component({
  selector: 'app-facebook-pixel-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    ClipboardModule,
    IslandComponent,
    StatusCardComponent,
    CommonIssuesComponent
  ],
  templateUrl: './facebook-pixel-modal.component.html',
  styleUrl: './facebook-pixel-modal.component.scss'
})
export class FacebookPixelModalComponent {
  private readonly dialogRef = inject(MatDialogRef<FacebookPixelModalComponent>);
  private readonly snackbarService = inject(SnackbarService);
  private readonly facebookStoreService = inject(FacebookStoreService);
  protected readonly data: IFacebookPixelModalData = inject(MAT_DIALOG_DATA);

  readonly copyButtonText = signal<string>('Copy');

  copyBusinessId(): void {
    this.copyButtonText.set('Copied');
    this.snackbarService.success('Business Portfolio ID copied to clipboard');

    setTimeout(() => {
      this.copyButtonText.set('Copy');
    }, 2000);
  }

  openBusinessPortfolio(): void {
    const url = `https://business.facebook.com/latest/settings/partners?business_id=${this.data.businessPortfolioId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  onContinue(): void {
    this.facebookStoreService.addOrUpdateGrantedAccess({
      success: true,
      service: FacebookServiceType.PIXEL,
      accessType: this.data.accessType,
      entityId: this.data.pixelId,
      agencyIdentifier: this.data.businessPortfolioId
    });

    this.snackbarService.info('Please complete the steps in Meta Business Manager');
    this.dialogRef.close(true);
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
