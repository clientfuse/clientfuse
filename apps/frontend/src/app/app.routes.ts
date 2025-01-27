import { Route } from '@angular/router';
import { isLoggedInGuard } from './guards/is-logged-in.guard';
import { isLoggedOutGuard } from './guards/is-logged-out.guard';
import { RoutesService } from './services/routes.service';

export const appRoutes: Route[] = [
  {
    path: RoutesService.routes.dashboard,
    canActivate: [isLoggedInGuard],
    loadComponent: () => import('./modules/dashboard/pages/dashboard-page/dashboard-page.component').then(c => c.DashboardPageComponent)
  },
  {
    path: RoutesService.routes.settings.root,
    canActivate: [isLoggedInGuard],
    canActivateChild: [isLoggedInGuard],
    loadChildren: () => import('./modules/settings/settings.routes').then(r => r.SETTINGS_ROUTES)
  },
  {
    path: RoutesService.routes.auth.root,
    canActivate: [isLoggedOutGuard],
    canActivateChild: [isLoggedOutGuard],
    loadChildren: () => import('./modules/auth/auth.routes').then(r => r.AUTH_ROUTES)
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
