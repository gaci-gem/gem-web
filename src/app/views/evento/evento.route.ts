import { Routes } from '@angular/router'
import { Eventos } from './eventos/eventos'
import { EventosUsuario } from './eventos-usuario/eventos-usuario'
import { Eventov2 } from './eventov2/eventov2'

export const  EVENTOS_ROUTES: Routes = [
  {
    path: 'evento/eventos',
    component: Eventos,
    data: { title: 'Eventos' },
  },
  {
    path: 'evento/eventos/usuario',
    component: EventosUsuario,
    data: { title: 'Eventos' },
  },
  {
    path: 'evento/evento/:id',
    component: Eventov2,
    data: { title: 'Evento' },
  },
]
