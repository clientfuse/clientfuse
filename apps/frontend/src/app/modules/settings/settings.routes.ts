import { Routes } from '@angular/router';
import { RoutesService } from '../../services/routes.service';
import { SettingsAffilatePageComponent } from './pages/settings-affilate-page/settings-affilate-page.component';
import { SettingsBillingPageComponent } from './pages/settings-billing-page/settings-billing-page.component';
import { SettingsIntegrationsPageComponent } from './pages/settings-integrations-page/settings-integrations-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { SettingsTeamsPageComponent } from './pages/settings-teams-page/settings-teams-page.component';
import { SettingsUserPageComponent } from './pages/settings-user-page/settings-user-page.component';
import { SettingsWebhooksPageComponent } from './pages/settings-webhooks-page/settings-webhooks-page.component';
import { SettingsWhiteLabelingPageComponent } from './pages/settings-white-labeling-page/settings-white-labeling-page.component';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: SettingsPageComponent,
    children: [
      {
        path: '',
        redirectTo: RoutesService.routes.settings.user,
        pathMatch: 'full'
      },
      {
        path: RoutesService.routes.settings.user,
        component: SettingsUserPageComponent
      },
      {
        path: RoutesService.routes.settings.billing,
        component: SettingsBillingPageComponent
      },
      {
        path: RoutesService.routes.settings.teams,
        component: SettingsTeamsPageComponent
      },
      {
        path: RoutesService.routes.settings.whiteLabeling,
        component: SettingsWhiteLabelingPageComponent
      },
      {
        path: RoutesService.routes.settings.integrations,
        component: SettingsIntegrationsPageComponent
      },
      {
        path: RoutesService.routes.settings.affiliate,
        component: SettingsAffilatePageComponent
      },
      {
        path: RoutesService.routes.settings.webhooks,
        component: SettingsWebhooksPageComponent
      }
    ]
  }
];
