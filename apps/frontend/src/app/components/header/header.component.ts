import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  private routesService = inject(RoutesService);
  protected authStoreService = inject(AuthStoreService);

  menuItems: {
    label: string;
    link: string;
    action?: Function;
  }[] = [
    {
      label: 'Dashboard',
      link: this.routesService.dashboard()
    },
    {
      label: 'Settings',
      link: this.routesService.settingsUser()
    },
    {
      label: 'Logout',
      link: '/logout',
      action: () => this.authStoreService.logout()
    }
  ];

}
