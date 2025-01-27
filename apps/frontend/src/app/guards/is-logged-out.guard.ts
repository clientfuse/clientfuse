import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthStoreService } from '../services/auth/auth-store.service';
import { RoutesService } from '../services/routes.service';


export const isLoggedOutGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  const authStoreService = inject(AuthStoreService);
  const router = inject(Router);
  const routesService = inject(RoutesService);

  if (!authStoreService.isLoggedIn()) {
    return true;
  }
  console.info('[isLoggedOutGuard]: User is logged in. Redirecting to home page.');
  void router.navigateByUrl(routesService.dashboard());

  return false;
};
