import { Component, inject } from '@angular/core';
import { IslandComponent } from '../../../../components/island/island.component';
import {
  FacebookSocialButtonComponent
} from '../../../../components/social-buttons/facebook-social-button/facebook-social-button.component';
import { GoogleSocialButtonComponent } from '../../../../components/social-buttons/google-social-button/google-social-button.component';
import { AuthStoreService } from '../../../../services/auth/auth-store.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [IslandComponent, FacebookSocialButtonComponent, GoogleSocialButtonComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  protected authStoreService = inject(AuthStoreService);
}
