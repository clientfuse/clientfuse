import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthStoreService } from '../services/auth/auth-store.service';
import { RoutesService } from '../services/routes.service';

export const isLoggedInGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  const authStoreService = inject(AuthStoreService);
  const router: Router = inject(Router);
  const routesService: RoutesService = inject(RoutesService);

  if (authStoreService.isLoggedIn()) return true;

  console.info('[isLoggedInGuard]: User is not logged in. Redirecting to login page.');
  void router.navigateByUrl(routesService.login());

  return false;
};
