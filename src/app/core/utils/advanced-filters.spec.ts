import { advancedFiltersFromTable, EVENTO_QUERY_FIELD_MAP, EVENTO_TABLE_FIELD_MAP, hasAdvancedFilterField, serializeAdvancedFilters, withoutCoveredLegacyFilters } from './advanced-filters';

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

  it('does not serialize the global table filter as an advanced filter', () => {
    const filters = advancedFiltersFromTable({
      global: { value: '24' },
      'etapaActualData.nombre': { value: 'Análisis' },
    }, EVENTO_TABLE_FIELD_MAP);

    expect(filters).toEqual([{ field: 'etapa', operator: 'and', constraints: [
      { matchMode: 'contains', value: 'Análisis' },
    ] }]);
    expect(serializeAdvancedFilters(filters)).not.toContain('global');
  });

  it('maps the stage column to the backend etapa field', () => {
    const filters = advancedFiltersFromTable({
      'etapaActualData.nombre': { value: 'En curso' },
    }, EVENTO_TABLE_FIELD_MAP);

    expect(filters[0].field).toBe('etapa');
  });

  it('uses cliente for the top-level event query while advanced filters keep client', () => {
    expect(EVENTO_QUERY_FIELD_MAP['cliente.nombre']).toBe('cliente');
    expect(EVENTO_QUERY_FIELD_MAP['cliente.nombre']).not.toBe('client');
    expect(EVENTO_TABLE_FIELD_MAP['cliente.nombre']).toBe('client');
  });

  it('omits legacy parameters covered by advanced filters, including aliases', () => {
    const params = withoutCoveredLegacyFilters({ etapa: 'ingreso', cliente: 'ACME', estado: 'abierto', keep: 'yes' }, [{ field: 'etapa', operator: 'and', constraints: [{ matchMode: 'contains', value: 'ingreso' }] }, { field: 'client', operator: 'and', constraints: [{ matchMode: 'contains', value: 'ACME' }] }], { etapa: 'etapa', client: ['cliente', 'client'] });
    expect(params).toEqual(jasmine.objectContaining({ estado: 'abierto', keep: 'yes' }));
    expect(params).not.toHaveProperty('etapa');
    expect(params).not.toHaveProperty('cliente');
  });
});
