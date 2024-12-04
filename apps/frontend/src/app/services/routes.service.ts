import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RoutesService {
  static readonly routes = {
    auth: {
      root: 'auth',
      login: 'login',
      registration: 'registration'
    },
    dashboard: '',
    settings: {
      root: 'settings',
      user: 'user',
      billing: 'billing',
      teams: 'teams',
      whiteLabeling: 'white-labeling',
      integrations: 'integrations',
      affilate: 'affilate',
      webhooks: 'webhooks'
    },
    errors: {
      '404': '404'
    }
  };

  login(): string {
    return `/${RoutesService.routes.auth.root}/${RoutesService.routes.auth.login}`;
  }

  registration(): string {
    return `/${RoutesService.routes.auth.root}/${RoutesService.routes.auth.registration}`;
  }

  dashboard(): string {
    return `/${RoutesService.routes.dashboard}`;
  }

  settings(): string {
    return `/${RoutesService.routes.settings.root}`;
  }

  settingsUser(): string {
    return `/${RoutesService.routes.settings.root}/${RoutesService.routes.settings.user}`;
  }

  settingsBilling(): string {
    return `/${RoutesService.routes.settings.root}/${RoutesService.routes.settings.billing}`;
  }

  settingsTeams(): string {
    return `/${RoutesService.routes.settings.root}/${RoutesService.routes.settings.teams}`;
  }

  settingsWhiteLabeling(): string {
    return `/${RoutesService.routes.settings.root}/${RoutesService.routes.settings.whiteLabeling}`;
  }

  settingsIntegrations(): string {
    return `/${RoutesService.routes.settings.root}/${RoutesService.routes.settings.integrations}`;
  }

  settingsAffilate(): string {
    return `/${RoutesService.routes.settings.root}/${RoutesService.routes.settings.affilate}`;
  }

  settingsWebhooks(): string {
    return `/${RoutesService.routes.settings.root}/${RoutesService.routes.settings.webhooks}`;
  }

  error404(): string {
    return `/${RoutesService.routes.errors['404']}`;
  }
}
