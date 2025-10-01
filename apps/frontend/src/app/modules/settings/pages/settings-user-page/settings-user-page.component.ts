import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  FacebookSocialButtonComponent
} from '../../../../components/social-buttons/facebook-social-button/facebook-social-button.component';
import { GoogleSocialButtonComponent } from '../../../../components/social-buttons/google-social-button/google-social-button.component';

@Component({
  selector: 'app-settings-user-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
    FacebookSocialButtonComponent,
    GoogleSocialButtonComponent
  ],
  templateUrl: './settings-user-page.component.html',
  styleUrl: './settings-user-page.component.scss'
})
export class SettingsUserPageComponent {
}
