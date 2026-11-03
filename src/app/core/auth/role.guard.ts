import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isBrowser) return true;
  if (!auth.role || !auth.token) return router.createUrlTree(['/login']);

  const allowedRoles = route.data['roles'] as UserRole[] | undefined;
  return !allowedRoles || allowedRoles.includes(auth.role)
    ? true
    : router.createUrlTree([`/${auth.role}`]);
};