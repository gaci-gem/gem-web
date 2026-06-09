import { NovedadEstado, NovedadTipo } from '@core/interfaces/novedad';

export function getTipoBadge(tipo: NovedadTipo): string {
  switch (tipo) {
    case NovedadTipo.COMUN: return 'bg-secondary';
    case NovedadTipo.AVISO: return 'bg-warning text-dark';
    case NovedadTipo.URGENCIA: return 'bg-danger';
    default: return 'bg-secondary';
  }
}

export function getTipoIcon(tipo: NovedadTipo): string {
  switch (tipo) {
    case NovedadTipo.COMUN: return 'lucideMessageSquare';
    case NovedadTipo.AVISO: return 'lucideTriangleAlert';
    case NovedadTipo.URGENCIA: return 'lucideCircleAlert';
    default: return 'lucideMessageSquare';
  }
}

export function getEstadoBadge(estado: NovedadEstado): string {
  switch (estado) {
    case NovedadEstado.ACTIVO: return 'bg-success';
    case NovedadEstado.ARCHIVADO: return 'bg-secondary';
    default: return 'bg-secondary';
  }
}
