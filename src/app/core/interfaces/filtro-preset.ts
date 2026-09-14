export type FiltroState = Record<string, unknown>;

export interface TablaFilterState {
  globalFilter: string;
  columnFilters: Record<string, { value: string; matchMode: string }>;
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
