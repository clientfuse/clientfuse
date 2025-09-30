import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SnackbarService } from '../../../../../../services/snackbar.service';

export interface IGoogleAdsDomainModalData {
  domain: string;
}

@Component({
  selector: 'app-google-ads-domain-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    ClipboardModule
  ],
  templateUrl: './google-ads-domain-modal.component.html',
  styleUrl: './google-ads-domain-modal.component.scss'
})
export class GoogleAdsDomainModalComponent {
  private readonly dialogRef = inject(MatDialogRef<GoogleAdsDomainModalComponent>);
  private readonly snackbarService = inject(SnackbarService);
  protected readonly data: IGoogleAdsDomainModalData = inject(MAT_DIALOG_DATA);

  readonly copyButtonText = signal<string>('Copy');
  readonly isCopied = computed(() => this.copyButtonText() === 'Copied');

  copyDomain(): void {
    this.copyButtonText.set('Copied');
    this.snackbarService.success('Domain copied to clipboard');

    setTimeout(() => {
      this.copyButtonText.set('Copy');
    }, 2000);
  }

  onContinue(): void {
    this.dialogRef.close(true);
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
