import { Route } from '@angular/router';
import { RoutesService } from './services/routes.service';

export const appRoutes: Route[] = [
  {
    path: RoutesService.routes.dashboard,
    loadComponent: () => import('./modules/dashboard/pages/dashboard-page/dashboard-page.component').then(c => c.DashboardPageComponent)
  },
  {
    path: RoutesService.routes.settings.root,
    loadChildren: () => import('./modules/settings/settings.routes').then(r => r.SETTINGS_ROUTES)
  },
  {
    path: RoutesService.routes.errors['404'],
    loadComponent: () => import('./pages/not-found-page/not-found-page.component').then(c => c.NotFoundPageComponent)
  },
  {
    path: '**',
    redirectTo: RoutesService.routes.errors['404']
  }
];
