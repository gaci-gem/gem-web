import { advancedFiltersFromTable, EVENTO_TABLE_FIELD_MAP, hasAdvancedFilterField, serializeAdvancedFilters } from './advanced-filters';

describe('advanced filters', () => {
  it('preserves all constraints and the operator when serializing a client filter', () => {
    const filters = advancedFiltersFromTable({ client: {
      operator: 'or',
      constraints: [
        { matchMode: 'contains', value: 'FAVA - FAVALORO' },
        { matchMode: 'notEquals', value: 'OTRO' },
      ],
    } });
    expect(JSON.parse(serializeAdvancedFilters(filters)!)).toEqual([{ field: 'client', operator: 'or', constraints: [
      { matchMode: 'contains', value: 'FAVA - FAVALORO' },
      { matchMode: 'notEquals', value: 'OTRO' },
    ] }]);
  });

  it('maps every event table field to the backend field and detects duplicates', () => {
    const filters = advancedFiltersFromTable({
      'cliente.nombre': { value: 'Cliente' },
      'etapaActualData.nombre': { value: 'Análisis' },
      'producto.nombre': { value: 'Producto' },
      'modulo.nombre': { value: 'Módulo' },
      'usuarioActual.usuario': { value: 'usuario' },
      evento: { value: 'CUS-001' },
      titulo: { value: 'Título' },
    }, EVENTO_TABLE_FIELD_MAP);

    expect(filters.map(({ field }) => field)).toEqual([
      'client', 'etapa', 'producto', 'modulo', 'usuario', 'eventoSearch', 'titulo',
    ]);
    expect(hasAdvancedFilterField(filters, 'producto')).toBe(true);
  });
});
