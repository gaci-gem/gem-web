import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermisosService } from '@core/services/permisos';

export const emailTemplateGuard: CanActivateFn = () => {
  const permisos = inject(PermisosService);
  return permisos.can('EMT.LEER') ? true : inject(Router).parseUrl('/error/403');
};
