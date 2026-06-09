import { Routes } from '@angular/router';
import { PermisoClave } from '@core/interfaces/rol';
import { PermisoVerGuard } from '@core/guards/permiso-ver.guard';

export const NOVEDAD_ROUTES: Routes = [
  {
    path: 'novedad/historial',
    loadComponent: () =>
      import('./novedad-history').then((mod) => mod.NovedadHistory),
    data: { title: 'Historial de Novedades', permisoClave: PermisoClave.NOV },
    canActivate: [PermisoVerGuard],
  },
];
