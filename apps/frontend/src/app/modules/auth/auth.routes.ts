import { Routes } from '@angular/router';
import { RoutesService } from '../../services/routes.service';
import { LoginCallbackPageComponent } from './pages/login-callback-page/login-callback-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: RoutesService.routes.auth.login,
    pathMatch: 'full'
  },
  {
    path: RoutesService.routes.auth.login,
    component: LoginPageComponent
  },
  {
    path: RoutesService.routes.auth.loginCallback,
    component: LoginCallbackPageComponent
  }
];
