export enum NovedadTipo {
  COMUN = 'Comun',
  AVISO = 'Aviso',
  URGENCIA = 'Urgencia'
}

export enum NovedadEstado {
  ACTIVO = 'Activo',
  ARCHIVADO = 'Archivado'
}

export interface Novedad {
  id: number;
  titulo: string;
  contenido: string;
  tipo: NovedadTipo;
  estado: NovedadEstado;
  validezDesde: string;
  validezHasta: string;
  enviarEmail: boolean;
  enviarDiscord: boolean;
  createdById: string;
  createdAt: string;
  createdBy?: {
    id: string;
    nombre: string;
    apellido?: string;
    usuario?: string;
    color?: string;
  };
}

export interface RecipientGroup {
  tipo: 'ALL' | 'BY_ROLE' | 'BY_USER';
  roles?: string[];
  usuarios?: string[];
}

export interface CreateNovedadDto {
  titulo: string;
  contenido: string;
  tipo: NovedadTipo;
  validezDesde?: string;
  validezHasta?: string;
  enviarEmail?: boolean;
  enviarDiscord?: boolean;
  recipients: RecipientGroup[];
}

export interface QueryNovedadDto {
  tipo?: NovedadTipo;
  estado?: NovedadEstado;
  fechaDesde?: string;
  fechaHasta?: string;
  createdById?: string;
  page?: number;
  limit?: number;
}

export interface DashboardResponse {
  items: Novedad[];
  urgentBanner: Novedad[];
}

export interface PaginatedNovedadResponse {
  data: Novedad[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
