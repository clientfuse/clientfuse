import { ComponentType } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(private dialog: MatDialog) {
  }

  open<C, D>(dialog: ComponentType<C>, data?: D, config?: MatDialogConfig) {
    return this.dialog.open(
      dialog,
      {
        data,
        autoFocus: false,
        disableClose: true,
        maxWidth: '700px',
        width: '100%',
        ...config
      }
    );
  }
}
