import { EventosUsuario } from './eventos-usuario';

describe('EventosUsuario sorting', () => {
  it('maps the PrimeNG event field alias to the server sort field', () => {
    const component = Object.create(EventosUsuario.prototype) as EventosUsuario & {
      table: { first: number };
      saveState: jasmine.Spy;
      loadItems: jasmine.Spy;
    };
    component.table = { first: 20 } as any;
    component.saveState = jasmine.createSpy('saveState');
    component.loadItems = jasmine.createSpy('loadItems');

    component.onTableSort({ field: 'evento', order: 1 });

    expect(component.sortField).toBe('numero');
    expect(component.sortDirection).toBe('asc');
    expect(component.table.first).toBe(0);
    expect(component.loadItems).toHaveBeenCalledOnceWith();
  });
});
