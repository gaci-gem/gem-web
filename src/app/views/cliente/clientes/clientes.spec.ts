import { Clientes } from './clientes';

describe('Clientes pagination', () => {
  it('resets the paginator before reloading after a global filter change', () => {
    const component = Object.create(Clientes.prototype) as any;
    component.globalFilter = '';
    component.table = { first: 20 };
    component.loadItems = jasmine.createSpy('loadItems');

    component.onGlobalFilter('acme');

    expect(component.table.first).toBe(0);
    expect(component.loadItems).toHaveBeenCalledOnceWith();
  });

  it('resets the paginator and reloads with the selected server sort', () => {
    const component = Object.create(Clientes.prototype) as any;
    component.table = { first: 20 };
    component.loadItems = jasmine.createSpy('loadItems');

    component.onTableSort({ sortField: 'nombre', sortOrder: 1 });

    expect(component.table.first).toBe(0);
    expect(component.sortField).toBe('nombre');
    expect(component.sortDirection).toBe('asc');
    expect(component.loadItems).toHaveBeenCalledOnceWith();
  });
});
