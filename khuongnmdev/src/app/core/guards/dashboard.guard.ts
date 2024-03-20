import { inject } from "@angular/core";
import { catchError, map, of, tap } from "rxjs";
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot, Routes } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const canActiveDashboard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authState$.pipe(
    tap((value) => console.log('value: ', value)),
    map((value) => {
      if (value !== null) {
        return true; // Authentication state is not null, return true
      } else {
        router.navigateByUrl('/login'); // Navigate to login page
        return false; // Authentication state is null, return false
      }
    }),
    catchError(() => {
      router.createUrlTree(['/login']);
      return of(false);
    })
  );
}

export const canActivateDashboardChild: CanActivateChildFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => canActiveDashboard(route, state);
