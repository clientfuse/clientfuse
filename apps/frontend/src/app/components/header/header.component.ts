import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ILink } from '../../models/navigation.model';
import { AuthStoreService } from '../../services/auth/auth-store.service';
import { RoutesService } from '../../services/routes.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  protected routesService = inject(RoutesService);
  protected authStoreService = inject(AuthStoreService);

  menuItems: ILink[] = [
    { label: 'Dashboard', url: this.routesService.dashboard() },
    { label: 'Settings', url: this.routesService.settingsUser() },
    { label: 'Logout', url: '/logout', action: () => this.authStoreService.logout() }
  ];

}
