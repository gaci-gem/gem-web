import { Table } from 'primeng/table';
import { TrabajarCon } from './trabajar-con';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { signal } from '@angular/core';

describe('TrabajarCon.restoreTableState', () => {
  class TestTrabajarCon extends TrabajarCon<unknown> {
    readonly pantalla = 'test';

    loadItems(): void {}
    alta(): void {}
    editar(): void {}
    eliminarDirecto(): void {}
    override exportarExcel(): void {}
    protected procesarExcel(): void {}
    protected descargarPlantilla(): void {}
    protected exportarExcelImpl(): void {}

    restore(state: Parameters<TrabajarCon<unknown>['restoreTableState']>[0], table: Table): void {
      this.restoreTableState(state, table);
    }
  }

  function createSubject(): TestTrabajarCon {
    const subject = Object.create(TestTrabajarCon.prototype) as TestTrabajarCon;
    (subject as any).searchValue = signal('');
    return subject;
  }

  it('asigna el mapa completo y ejecuta un único ciclo de filtro', () => {
    const filterCycles: unknown[] = [];
    const etiquetas = ['uno', 'dos'];
    const table = {
       filters: {
         'etapaActualData.nombre': [{ value: null, matchMode: 'contains', operator: 'and' }],
       },
      _filter: () => filterCycles.push(true),
      first: { set: jasmine.createSpy('first.set') },
      rows: { set: jasmine.createSpy('rows.set') },
      sortSingle: jasmine.createSpy('sortSingle'),
    } as unknown as Table;

    createSubject().restore({
      filtroActivo: FiltroActivo.FALSE,
      globalFilter: '',
      columnFilters: {
        'cliente.nombre': { value: 'gaci', matchMode: 'contains' },
        etiquetas: { value: etiquetas, matchMode: 'in' },
      },
      first: 0,
      rows: 10,
      sortField: null,
      sortOrder: 1,
    }, table);

    expect(table.filters as any).toEqual({
      'etapaActualData.nombre': [{ value: null, matchMode: 'contains', operator: 'and' }],
      'cliente.nombre': [{ value: 'gaci', matchMode: 'contains', operator: 'and', applyFilter: true }],
      etiquetas: [{ value: ['uno', 'dos'], matchMode: 'in', operator: 'and', applyFilter: true }],
    });
    expect(filterCycles).toHaveSize(1);
    expect((table.filters as any)['cliente.nombre']).toEqual([
      { value: 'gaci', matchMode: 'contains', operator: 'and', applyFilter: true },
    ]);
    expect((table.filters as any).etiquetas[0].value).toEqual(['uno', 'dos']);
    expect((table.filters as any).etiquetas[0].value).not.toBe(etiquetas);
  });

  it('captura y restaura todas las reglas de un filtro compuesto en orden', () => {
    const subject = createSubject();
    const originalRules = [
      { value: 'gaci', matchMode: 'contains', operator: 'and', metadata: ['uno'] },
      { value: 'fundacion', matchMode: 'startsWith', operator: 'and', metadata: ['dos'] },
    ];
    const table = {
      filters: { 'cliente.nombre': originalRules },
      first: () => 0,
      rows: () => 10,
    } as unknown as Table;

    const state = (subject as any).captureTableState(table);

    expect(state.columnFilters['cliente.nombre']).toEqual(originalRules);
    expect(state.columnFilters['cliente.nombre']).not.toBe(originalRules);
    expect((state.columnFilters['cliente.nombre'] as any[])[0].metadata).not.toBe(originalRules[0].metadata);

    const restoredTable = {
      filters: {},
      _filter: jasmine.createSpy('_filter'),
      first: { set: jasmine.createSpy('first.set') },
      rows: { set: jasmine.createSpy('rows.set') },
      sortSingle: jasmine.createSpy('sortSingle'),
    } as unknown as Table;
    subject.restore(state, restoredTable);

    expect((restoredTable.filters as any)['cliente.nombre']).toEqual([
      { ...originalRules[0], applyFilter: true },
      { ...originalRules[1], applyFilter: true },
    ]);
    expect((restoredTable.filters as any)['cliente.nombre'][0].operator).toBe('and');
    expect((restoredTable.filters as any)['cliente.nombre'][1].matchMode).toBe('startsWith');
    expect((restoredTable as any)._filter).toHaveBeenCalledOnceWith();
  });

  it('restaura el filtro global dentro del mismo mapa', () => {
    const table = {
      filters: {},
      _filter: jasmine.createSpy('_filter'),
      first: { set: jasmine.createSpy('first.set') },
      rows: { set: jasmine.createSpy('rows.set') },
      sortSingle: jasmine.createSpy('sortSingle'),
    } as unknown as Table;

    createSubject().restore({
      globalFilter: 'gaci',
      columnFilters: {},
    }, table);

    expect((table.filters as any)['global']).toEqual({ value: 'gaci', matchMode: 'contains', applyFilter: true });
    expect((table as any)._filter).toHaveBeenCalledOnceWith();
  });
});
