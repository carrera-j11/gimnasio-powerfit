import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from './models';
import { AuthService } from './services/auth.service';

/** Exige sesión iniciada; si no, lleva al login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token ? true : inject(Router).createUrlTree(['/login']);
};

/** Exige uno de los roles indicados en la ruta: data: { roles: ['ADMIN', ...] } */
export const rolGuard: CanActivateFn = (route) => {
  const roles = (route.data['roles'] ?? []) as Rol[];
  return inject(AuthService).tieneRol(...roles) ? true : inject(Router).createUrlTree(['/acceso-denegado']);
};

/** Para login y registro: si ya hay sesión, va directo al panel. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token ? inject(Router).createUrlTree(['/panel']) : true;
};
