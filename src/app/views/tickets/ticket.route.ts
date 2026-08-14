import { Routes } from '@angular/router';
import { Tickets } from './tickets/tickets';
import { PermisoVerGuard } from '@core/guards/permiso-ver.guard';
import { PermisoClave } from '@core/interfaces/rol';

export const TICKET_ROUTES: Routes = [
  {
    path: 'portal-cliente/tickets',
    component: Tickets,
    data: { title: 'Tickets Portal Cliente', permisoClave: PermisoClave.TICKET },
    canActivate: [PermisoVerGuard],
  },
];
