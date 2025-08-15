import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

export interface IUpdateEmailModalForm {
  email: FormControl<string | null>;
}

@Component({
  selector: 'app-update-email-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatError, MatButton],
  templateUrl: './update-email-modal.component.html',
  styleUrl: './update-email-modal.component.scss'
})
export class UpdateEmailModalComponent {
  private readonly dialogRef = inject(MatDialogRef<UpdateEmailModalComponent>);

  form: FormGroup<IUpdateEmailModalForm> = new FormGroup<IUpdateEmailModalForm>({
    email: new FormControl('', { validators: [Validators.required, Validators.email] })
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.email);
  }
}
