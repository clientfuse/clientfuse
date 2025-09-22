import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { GoogleSearchConsolePermissionLevel, GoogleServiceType, TAccessType } from '@clientfuse/models';
import { IslandComponent } from '../../../../../../components/island/island.component';
import { StatusCardComponent } from '../../../../../../components/status-card/status-card.component';
import { GoogleStoreService } from '../../../../../../services/google/google-store.service';
import { SnackbarService } from '../../../../../../services/snackbar.service';

export interface IGoogleSearchConsoleModalData {
  domain: string;
  agencyEmail: string;
  accessType: TAccessType;
  agencyId?: string;
}

@Component({
  selector: 'app-google-search-console-modal',
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
    StatusCardComponent
  ],
  templateUrl: './google-search-console-modal.component.html',
  styleUrl: './google-search-console-modal.component.scss'
})
export class GoogleSearchConsoleModalComponent {
  private readonly dialogRef = inject(MatDialogRef<GoogleSearchConsoleModalComponent>);
  private readonly snackbarService = inject(SnackbarService);
  private readonly googleStoreService = inject(GoogleStoreService);
  protected readonly data: IGoogleSearchConsoleModalData = inject(MAT_DIALOG_DATA);

  readonly copyButtonText = signal<string>('Copy');
  readonly isChecking = signal<boolean>(false);
  readonly accessStatus = signal<'pending' | 'granted' | 'not_granted' | 'incorrect_access'>('pending');
  readonly accessMessage = signal<string>('');

  copyEmail(): void {
    this.copyButtonText.set('Copied');
    this.snackbarService.success('Email copied to clipboard');

    setTimeout(() => {
      this.copyButtonText.set('Copy');
    }, 2000);
  }

  openSettingsPage(): void {
    const url = `https://search.google.com/search-console/users?resource_id=${this.data.domain}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async checkAccess(): Promise<void> {
    this.isChecking.set(true);

    try {
      await this.googleStoreService.loadEntityUsers({
        service: 'searchConsole' as GoogleServiceType,
        entityId: this.data.domain,
        agencyId: this.data.agencyId
      });

      const entityUsers = this.googleStoreService.entityUsers();
      if (entityUsers && entityUsers.users && entityUsers.users.length > 0) {
        const agencyUser = entityUsers.users.find(
          user => user.email.toLowerCase() === this.data.agencyEmail.toLowerCase()
        );

        if (agencyUser) {
          const permissionLevel = agencyUser.permissions[0];
          const expectedLevel = this.data.accessType === 'manage'
            ? GoogleSearchConsolePermissionLevel.SITE_OWNER
            : GoogleSearchConsolePermissionLevel.SITE_RESTRICTED_USER;

          const hasCorrectAccess = permissionLevel === expectedLevel;

          if (hasCorrectAccess) {
            this.accessStatus.set('granted');
            const accessTypeText = this.data.accessType === 'manage' ? 'Owner' : 'Restricted';
            const message = `Access granted successfully with correct ${accessTypeText} permissions!`;
            this.accessMessage.set(message);
            this.snackbarService.success(message);

            this.googleStoreService.addOrUpdateGrantedAccess({
              success: true,
              service: 'searchConsole' as GoogleServiceType,
              accessType: this.data.accessType,
              entityId: this.data.domain,
              agencyIdentifier: this.data.agencyEmail
            });

            setTimeout(() => this.dialogRef.close(true), 1500);
          } else {
            this.accessStatus.set('incorrect_access');
            const currentAccessType = this.getAccessTypeFromPermission(permissionLevel);
            const expectedAccessType = this.data.accessType === 'manage' ? 'Owner' : 'Restricted';
            const message = `Incorrect access level! Granted: ${currentAccessType}, Required: ${expectedAccessType}. Please adjust the permissions.`;
            this.accessMessage.set(message);
            this.snackbarService.warn(message);

            this.googleStoreService.addOrUpdateGrantedAccess({
              success: true,
              service: 'searchConsole' as GoogleServiceType,
              accessType: this.data.accessType,
              entityId: this.data.domain,
              agencyIdentifier: this.data.agencyEmail
            });
          }
        } else {
          this.accessStatus.set('not_granted');
          const message = 'Access not yet granted. Please complete the steps above.';
          this.accessMessage.set(message);
          this.snackbarService.info(message);
        }
      } else {
        this.accessStatus.set('not_granted');
        const message = 'Access not yet granted. Please complete the steps above.';
        this.accessMessage.set(message);
        this.snackbarService.info(message);
      }
    } catch (error) {
      console.error('Failed to check access:', error);
      this.snackbarService.error('Failed to check access. Please try again.');
      this.accessStatus.set('not_granted');
    } finally {
      this.isChecking.set(false);
    }
  }

  private getAccessTypeFromPermission(permission: string): string {
    switch (permission) {
      case GoogleSearchConsolePermissionLevel.SITE_OWNER:
        return 'Owner';
      case GoogleSearchConsolePermissionLevel.SITE_FULL_USER:
        return 'Full';
      case GoogleSearchConsolePermissionLevel.SITE_RESTRICTED_USER:
        return 'Restricted';
      case GoogleSearchConsolePermissionLevel.SITE_UNVERIFIED_USER:
        return 'Unverified';
      default:
        return 'Unknown';
    }
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
