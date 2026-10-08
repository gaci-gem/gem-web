import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';
import { VerticalLayout } from '@layouts/vertical-layout/vertical-layout';
import { SharedTicket } from './views/shared-ticket/shared-ticket';

export const routes: Routes = [
  { path: 'shared/ticket/:token', component: SharedTicket },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: VerticalLayout,
    loadChildren: () =>
      import('./views/views.route').then((mod) => mod.VIEWS_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadChildren: () =>
      import('./views/auth/auth.route').then((mod) => mod.Auth_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('./views/error/error.route').then((mod) => mod.ERROR_PAGES_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'error/404',
  },
];
