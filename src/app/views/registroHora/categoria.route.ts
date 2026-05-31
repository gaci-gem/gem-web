import { Routes } from '@angular/router'
import { Categorias } from './categorias/categorias'

export const CATEGORIAS_ROUTES: Routes = [
  {
    path: 'hora/categorias',
    component: Categorias,
    data: { title: 'Tipos de Trabajo' },
  },
]
