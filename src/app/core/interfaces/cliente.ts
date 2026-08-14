import { ClienteProyecto } from "./proyecto";

export interface Cliente {
  id?: number;
  sigla: string;
  nombre?: string;
  activo: boolean;
  proyectoIds?: number[];
  credentialCount?: number;

  proyectos?: ClienteProyecto[];
  // eventos?: Evento[];
}
