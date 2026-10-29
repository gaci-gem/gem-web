export type AdvancedFilterMatchMode =
  | 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'notContains' | 'notEquals';

export interface AdvancedFilterConstraint {
  matchMode: AdvancedFilterMatchMode;
  value: string | number | boolean;
}

export interface AdvancedFilter {
  field: string;
  operator: 'and' | 'or';
  constraints: AdvancedFilterConstraint[];
}

export const EVENTO_TABLE_FIELD_MAP: Record<string, string> = {
  evento: 'eventoSearch',
  eventoSearch: 'eventoSearch',
  titulo: 'titulo',
  'cliente.nombre': 'client',
  'etapaActualData.nombre': 'etapa',
  'producto.nombre': 'producto',
  'modulo.nombre': 'modulo',
  'usuarioActual.usuario': 'usuario',
};

export const EVENTO_QUERY_FIELD_MAP: Record<string, string> = {
  evento: 'eventoSearch',
  eventoSearch: 'eventoSearch',
  titulo: 'titulo',
  'cliente.nombre': 'cliente',
  'etapaActualData.nombre': 'etapa',
  'producto.nombre': 'producto',
  'modulo.nombre': 'modulo',
  'usuarioActual.usuario': 'usuario',
};

export function hasAdvancedFilterField(filters: AdvancedFilter[], field: string): boolean {
  return filters.some((filter) => filter.field === field);
}

export function withoutCoveredLegacyFilters<T extends Record<string, unknown>>(
  params: T,
  filters: Array<{ field: string }>,
  fieldAliases: Record<string, string | string[]>,
): T {
  const covered = new Set<string>();
  for (const filter of filters) {
    const legacyFields = fieldAliases[filter.field];
    for (const field of Array.isArray(legacyFields) ? legacyFields : [legacyFields]) {
      if (field) covered.add(field);
    }
  }
  return Object.fromEntries(Object.entries(params).filter(([key]) => !covered.has(key))) as T;
}

export function serializeAdvancedFilters(filters: AdvancedFilter[]): string | undefined {
  return filters.length ? JSON.stringify(filters) : undefined;
}

export function advancedFiltersFromTable(
  tableFilters: Record<string, unknown> | undefined,
  fields: Record<string, string> = {},
): AdvancedFilter[] {
  const result: AdvancedFilter[] = [];
  for (const [tableField, metadata] of Object.entries(tableFilters ?? {})) {
    if (tableField === 'global') continue;
    const field = fields[tableField] ?? tableField;
    const entries = Array.isArray(metadata) ? metadata : [metadata];
    const constraints = entries.flatMap((entry: any) => entry?.constraints ?? [entry])
      .filter((constraint: any) => constraint?.value !== null && constraint?.value !== undefined && constraint.value !== '')
      .map((constraint: any) => ({
        matchMode: String(constraint.matchMode ?? 'contains') as AdvancedFilterMatchMode,
        value: constraint.value instanceof Date ? constraint.value.toISOString().slice(0, 10) : constraint.value,
      }));
    if (constraints.length) {
      result.push({
        field,
        operator: entries.some((entry: any) => entry?.operator === 'or') ? 'or' : 'and',
        constraints,
      });
    }
  }
  return result;
}
