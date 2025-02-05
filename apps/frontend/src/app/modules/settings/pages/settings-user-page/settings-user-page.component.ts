import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-settings-user-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatFormField, MatHint, MatIcon, MatInput, MatLabel, MatSuffix, MatTooltip],
  templateUrl: './settings-user-page.component.html',
  styleUrl: './settings-user-page.component.scss'
})
export class SettingsUserPageComponent {
}
