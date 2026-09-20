import { Usuarios } from './usuarios';

describe('Usuarios pagination', () => {
  it('resets the paginator before reloading after a global filter change', () => {
    const component = Object.create(Usuarios.prototype) as any;
    component.globalFilter = '';
    component.table = { first: 20 };
    component.loadItems = jasmine.createSpy('loadItems');

    component.onGlobalFilter('ana');

    expect(component.table.first).toBe(0);
    expect(component.loadItems).toHaveBeenCalledOnceWith();
  });

  it('resets the paginator and reloads with the selected server sort', () => {
    const component = Object.create(Usuarios.prototype) as any;
    component.table = { first: 20 };
    component.loadItems = jasmine.createSpy('loadItems');

    component.onTableSort({ field: 'apellido', order: -1 });

    expect(component.table.first).toBe(0);
    expect(component.sortField).toBe('apellido');
    expect(component.sortDirection).toBe('desc');
    expect(component.loadItems).toHaveBeenCalledOnceWith();
  });
});
