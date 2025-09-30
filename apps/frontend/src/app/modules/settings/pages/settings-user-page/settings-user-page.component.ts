import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-settings-user-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatFormField, MatHint, MatInput, MatLabel],
  templateUrl: './settings-user-page.component.html',
  styleUrl: './settings-user-page.component.scss'
})
export class SettingsUserPageComponent {
}
