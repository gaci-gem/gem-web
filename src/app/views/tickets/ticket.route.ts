import { Routes } from '@angular/router';
import { Tickets } from './tickets/tickets';
import { PermisoVerGuard } from '@core/guards/permiso-ver.guard';
import { PermisoClave } from '@core/interfaces/rol';

export const TICKET_ROUTES: Routes = [
  {
    path: 'gem-clientes/tickets',
    component: Tickets,
    data: { title: 'Tickets GEM Clientes', permisoClave: PermisoClave.TICKET },
    canActivate: [PermisoVerGuard],
  },
];
