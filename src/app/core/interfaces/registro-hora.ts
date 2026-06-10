import { Evento } from "./evento"
import { Usuario } from "./usuario"

export interface RegistroHora {
  id?: number;
  fecha: Date;
  usuarioId: string;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    usuario: string;
  };
  horasTotales?: number;
  horasTotalesFormateadas?: string;
  horas?: Hora[];
}

export interface Hora {
  id?: number;
  registroId?: number;
  eventoId: string;
  inicio: string;
  fin: string;
  detalle?: string;
  diferencia?: string;
  diferenciaFormateada?: string;

  evento?: Evento;
  registro?: RegistroHora;

  categoriaCodigo?: string | null;
  categoria?: { codigo: string; descripcion: string; color: string } | null;
}

export interface HorasPorCategoriaItem {
  codigo: string;
  descripcion: string;
  totalHoras: number;
  totalFormateado: string;
  cantidadRegistros: number;
}

export interface HorasPorCategoriaResponse {
  eventoId: string;
  categorias: HorasPorCategoriaItem[];
  totalGeneral: number;
  totalGeneralFormateado: string;
}

export interface Categoria {
  codigo: string;
  descripcion: string;
  activo: boolean;
  color: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface UsuarioHorasGenerales {
  id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  totalMes?: number;
  totalMesFormateado?: string;
  registrosHora: RegistroHora[];
}