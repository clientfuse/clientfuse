import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ILink } from '../../../../models/navigation.model';
import { NavigationService } from '../../../../services/navigation.service';
import { RoutesService } from '../../../../services/routes.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatTabsModule, RouterModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent {
  private routesService = inject(RoutesService);
  private navigationService = inject(NavigationService);

  links: ILink[] = [
    { label: 'General', url: this.routesService.settingsUser() },
    { label: 'Billing', url: this.routesService.settingsBilling() },
    { label: 'Teams', url: this.routesService.settingsTeams() },
    { label: 'White-labeling', url: this.routesService.settingsWhiteLabeling() },
    { label: 'Integrations', url: this.routesService.settingsIntegrations() },
    { label: 'Affiliate', url: this.routesService.settingsAffiliate() },
    { label: 'Webhooks & API', url: this.routesService.settingsWebhooks() }
  ];
  currentUrl = this.navigationService.currentUrl;
}
