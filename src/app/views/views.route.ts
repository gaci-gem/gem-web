import { Routes } from '@angular/router'
import { PermisoVerGuard } from '@core/guards/permiso-ver.guard'
import { PermisoClave } from '@core/interfaces/rol'
import { Dashboard } from './dashboard/dashboard'

export const VIEWS_ROUTES: Routes = [
  {
    path: 'dashboard',
    component: Dashboard,
    data: { title: 'Dashboard', permisoClave: 'ADM' },
  },
  {
    path: '',
    loadChildren: () =>
      import('./usuario/usuario.route').then((mod) => mod.USUARIOS_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('./rol/rol.route').then((mod) => mod.ROLES_ROUTES),
    data: { permisoClave: PermisoClave.ROL },
    canActivate: [PermisoVerGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./etapa/etapa.route').then((mod) => mod.ETAPAS_ROUTES),
    data: { permisoClave: PermisoClave.ETAPA },
    canActivate: [PermisoVerGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./tipo-evento/tipo-evento.route').then((mod) => mod.TIPO_EVENTO_ROUTES),
    data: { permisoClave: PermisoClave.TIPO_EVENTO },
    canActivate: [PermisoVerGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./entorno/entorno.route').then((mod) => mod.ENTORNOS_ROUTES),
    data: { permisoClave: PermisoClave.ENTORNO },
    canActivate: [PermisoVerGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./producto/producto.route').then((mod) => mod.PRODUCTOS_ROUTES),
    data: { permisoClave: PermisoClave.PRODUCTO },
    canActivate: [PermisoVerGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./modulo/modulo.route').then((mod) => mod.MODULOS_ROUTES),
    data: { permisoClave: PermisoClave.MODULO },
    canActivate: [PermisoVerGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./cliente/cliente.route').then((mod) => mod.CLIENTE_ROUTES),
    data: { permisoClave: PermisoClave.CLIENTE },
    canActivate: [PermisoVerGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./proyecto/proyecto.route').then((mod) => mod.PROYECTO_ROUTES),
    data: { permisoClave: PermisoClave.PROYECTO },
    canActivate: [PermisoVerGuard]
  },


  // Evento y registroHora quedan públicos
  {
    path: '',
    loadChildren: () =>
      import('./evento/evento.route').then((mod) => mod.EVENTOS_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('./registroHora/registroHora.route').then((mod) => mod.HORAS_ROUTES),
  },

  {
    path: '',
    loadChildren: () =>
      import('./reporte/reporte.route').then((mod) => mod.REPORTES_ROUTES),
    data: { permisoClave: PermisoClave.REPORTE },
    canActivate: [PermisoVerGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./parametro/parametro.route').then((mod) => mod.PARAMETROS_ROUTES),
    data: { permisoClave: PermisoClave.SISTEMA },
    canActivate: [PermisoVerGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./registroHora/categoria.route').then((mod) => mod.CATEGORIAS_ROUTES),
    data: { permisoClave: PermisoClave.TIPO_TRABAJO },
    canActivate: [PermisoVerGuard]
  },
  {
    path: '',
    loadChildren: () =>
      import('./archivos/archivos.route').then((mod) => mod.ARCHIVOS_ROUTES),
  },

  {
    path: '',
    loadChildren: () =>
      import('./kb/kb.route').then((mod) => mod.KB_ROUTES),
    data: { permisoClave: PermisoClave.KB },
    canActivate: [PermisoVerGuard]
  },

  // Changelog (público)
  {
    path: 'changelog',
    loadComponent: () =>
      import('./changelog/changelog').then((mod) => mod.ChangelogComponent),
    data: { title: 'Novedades' },
  },

  // Novedades
  {
    path: '',
    loadChildren: () =>
      import('./novedad/novedad.route').then((mod) => mod.NOVEDAD_ROUTES),
    data: { permisoClave: PermisoClave.NOV },
    canActivate: [PermisoVerGuard]
  },



]

