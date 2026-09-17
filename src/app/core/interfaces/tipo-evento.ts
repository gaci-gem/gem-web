export interface TipoEvento {
  codigo: string;
  descripcion: string;
  activo?: boolean;
  color: string;
  propio?: boolean;
  facturable?: boolean;
  facturableAuto?: boolean;
  label?: string;
  // eventos?: Evento[];
  etapas?: TipoEventoEtapa[];
}

export interface TipoEventoEtapa {
  tipoEventoCodigo?: string;
  etapaId: number;
  etapaSecuencia: number;
  rollbackSec?: number;
  marcaInicio?: boolean;
  marcaFin?: boolean;
}

export interface TipoEventoTimeline {
  tipoEventoCodigo: string;
  descripcion: string;
  etapas: TipoEventoTimelineEtapa[];
}

export interface TipoEventoTimelineEtapa {
  id: number;
  nombre: string;
  secuencia: number;
  deAutoriza: boolean;
  deArchivo: boolean;
  marcaInicio?: boolean;
  marcaFin?: boolean;
  rolPreferido: string;
  rollback?: {
    secuencia: number;
    nombre: string;
  };
}
