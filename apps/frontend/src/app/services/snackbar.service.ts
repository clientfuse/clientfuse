import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private snackbar: MatSnackBar = inject(MatSnackBar);

  success(message: string, action: string = 'OK', duration: number = 5000): void {
    this.snackbar.open(message, action, {
      duration,
      panelClass: ['snackbar--success'],
      verticalPosition: 'top'
    });
  }

  error(message: string, action: string = 'OK', duration: number = 5000): void {
    this.snackbar.open(message, action, {
      duration,
      panelClass: ['snackbar--error'],
      verticalPosition: 'top'
    });
  }

  warn(message: string, action: string = 'OK', duration: number = 5000): void {
    this.snackbar.open(message, action, {
      duration,
      panelClass: ['snackbar--warn'],
      verticalPosition: 'top'
    });

  }

  info(message: string, action: string = 'OK', duration: number = 5000): void {
    this.snackbar.open(message, action, {
      duration,
      panelClass: ['snackbar--info'],
      verticalPosition: 'top'
    });
  }

}
