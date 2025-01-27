import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { IslandComponent } from '../../../../components/island/island.component';
import { AuthStoreService } from '../../../../services/auth/auth-store.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [MatButton, IslandComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  protected authStoreService = inject(AuthStoreService);
}
