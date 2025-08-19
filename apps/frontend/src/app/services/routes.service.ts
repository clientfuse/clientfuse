import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RoutesService {
  static readonly routes = {
    auth: {
      root: 'auth',
      login: 'login',
      loginCallback: 'login-callback'
    },
    dashboard: '',
    settings: {
      root: 'settings',
      user: 'user',
      billing: 'billing',
      teams: 'teams',
      whiteLabeling: 'white-labeling',
      integrations: 'integrations',
      affiliate: 'affiliate',
      webhooks: 'webhooks'
    },
    connections: {
      root: 'connect',
      viewConnection: ':connectionId/view',
      manageConnection: ':connectionId/manage'
    },
    errors: {
      '404': '404'
    }
  };

  login(): string {
    return `/${RoutesService.routes.auth.root}/${RoutesService.routes.auth.login}`;
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

  settingsAffiliate(): string {
    return `/${RoutesService.routes.settings.root}/${RoutesService.routes.settings.affiliate}`;
  }

  settingsWebhooks(): string {
    return `/${RoutesService.routes.settings.root}/${RoutesService.routes.settings.webhooks}`;
  }

  error404(): string {
    return `/${RoutesService.routes.errors['404']}`;
  }
}
