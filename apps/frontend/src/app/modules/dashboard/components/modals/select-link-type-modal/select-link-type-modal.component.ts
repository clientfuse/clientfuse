import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TAccessType } from '@clientfuse/models';

export interface ISelectLinkTypeModalResult {
  type: TAccessType;
}

@Component({
  selector: 'app-select-link-type-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './select-link-type-modal.component.html',
  styleUrls: ['./select-link-type-modal.component.scss']
})
export class SelectLinkTypeModalComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<SelectLinkTypeModalComponent>);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      type: ['view', Validators.required]
    });
  }

  onConfirm(): void {
    if (this.form.valid) {
      this.dialogRef.close({ type: this.form.value.type } as ISelectLinkTypeModalResult);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}