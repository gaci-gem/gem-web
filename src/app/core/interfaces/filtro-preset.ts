export type FiltroState = Record<string, unknown>;

export interface TablaFilterMetadata {
  value: unknown;
  matchMode: string;
  operator?: string;
  [key: string]: unknown;
}

export interface TablaFilterState {
  globalFilter: string;
  columnFilters: Record<string, TablaFilterMetadata | TablaFilterMetadata[]>;
  sortField: string | null;
  sortOrder: 1 | -1 | 0;
  first: number;
  rows: number;
}

export interface EventoFilterState extends FiltroState, TablaFilterState {
  filtroActivo: string;
  fecha: [string, string] | null;
}

export interface FiltroPreset {
  id: string;
  nombre: string;
  filtros: FiltroState;
  esDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
