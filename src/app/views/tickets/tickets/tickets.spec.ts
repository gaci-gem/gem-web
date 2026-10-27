import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of, Subject } from 'rxjs';
import { Tickets } from './tickets';

describe('Tickets', () => {
  it('opens ticket event creation with the DynamicDialog close control enabled', () => {
    const ref = jasmine.createSpyObj<DynamicDialogRef>('DynamicDialogRef', ['close'], { onClose: of(null) });
    const dialog = jasmine.createSpyObj<DialogService>('DialogService', ['open']);
    dialog.open.and.returnValue(ref);

    const component = Object.create(Tickets.prototype) as any;
    component.dialog = dialog;
    component.loading = jasmine.createSpyObj('LoadingService', ['show', 'hide']);
    component.service = jasmine.createSpyObj('TicketService', ['createEvent']);
    component.drawers = jasmine.createSpyObj('DrawerService', ['cerrarTicketDrawer', 'abrirTicketDrawer']);
    component.messages = jasmine.createSpyObj('MessageService', ['add']);
    component.permissions = jasmine.createSpyObj('PermisosService', ['can']);
    component.permissions.can.and.returnValue(true);
    component.loadItems = jasmine.createSpy('loadItems');
    component.showError = jasmine.createSpy('showError');

    component.createEvent({
      id: 7,
      clientId: 11,
      clientCode: 'CLI',
      clientName: 'Client',
    } as any);

    expect(dialog.open).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ closable: true }));
  });

  it('refreshes after EventoCrud closes successfully without resubmitting the close wrapper', () => {
    const closeResult = { changed: true, result: { id: 'event-1' } };
    const ref = jasmine.createSpyObj<DynamicDialogRef>('DynamicDialogRef', ['close'], { onClose: of(closeResult) });
    const dialog = jasmine.createSpyObj<DialogService>('DialogService', ['open']);
    const service = jasmine.createSpyObj('TicketService', ['createEvent']);
    dialog.open.and.returnValue(ref);

    const component = Object.create(Tickets.prototype) as any;
    component.dialog = dialog;
    component.loading = jasmine.createSpyObj('LoadingService', ['show', 'hide']);
    component.service = service;
    component.drawers = jasmine.createSpyObj('DrawerService', ['cerrarTicketDrawer', 'abrirTicketDrawer']);
    component.messages = jasmine.createSpyObj('MessageService', ['add']);
    component.permissions = jasmine.createSpyObj('PermisosService', ['can']);
    component.permissions.can.and.returnValue(true);
    component.loadItems = jasmine.createSpy('loadItems');
    component.showError = jasmine.createSpy('showError');

    component.createEvent({ id: 7, clientId: 11, clientCode: 'CLI', clientName: 'Client' } as any);

    expect(service.createEvent).not.toHaveBeenCalledWith(7, closeResult);
    expect(component.loadItems).toHaveBeenCalled();
  });

  it('resets the visible paginator offset when filters return to the first page', () => {
    const component = Object.create(Tickets.prototype) as any;
    component.table = { first: 20 };
    component.search = 'access';
    component.estado = '';
    component.loadItems = jasmine.createSpy('loadItems');

    component.onFilterChange();

    expect(component.page).toBe(1);
    expect(component.table.first).toBe(0);
    expect(component.loadItems).toHaveBeenCalled();
  });

  it('resets pagination and reloads when the client selection changes', () => {
    const component = Object.create(Tickets.prototype) as any;
    component.table = { first: 20 };
    component.page = 3;
    component.loadItems = jasmine.createSpy('loadItems');

    const cliente = { id: 7, sigla: 'ACME', nombre: 'Acme S.A.', activo: true };
    component.onClientesChange([cliente]);

    expect(component.clientesSeleccionados).toEqual([cliente]);
    expect(component.page).toBe(1);
    expect(component.table.first).toBe(0);
    expect(component.loadItems).toHaveBeenCalledOnceWith();
  });

  it('serializes selected clients by numeric id instead of the visible label', () => {
    const component = Object.create(Tickets.prototype) as any;
    component.advancedFilters = [];
    component.clientesSeleccionados = [{ id: 2, sigla: 'GACI', nombre: 'GACI' }];
    component.search = '';
    component.idFilter = '';
    component.clientFilter = '';
    component.estado = '';
    component.prioridad = '';
    component.tipo = '';
    component.subjectFilter = '';
    component.externalReferenceFilter = '';
    component.eventsFilter = '';
    component.assignedUserFilter = '';
    component.createdFrom = '';
    component.createdTo = '';
    component.page = 1;
    component.limit = 10;
    component.sortField = 'createdAt';
    component.sortDirection = 'desc';
    component.loading = jasmine.createSpyObj('LoadingService', ['show', 'hide']);
    component.service = jasmine.createSpyObj('TicketService', ['list']);
    component.service.list.and.returnValue(of({ data: [], total: 0 }));

    component.loadItems();

    expect(component.service.list).toHaveBeenCalledWith(jasmine.objectContaining({
      advancedFilters: [{ field: 'clientId', operator: 'or', constraints: [{ matchMode: 'equals', value: 2 }] }],
    }));
  });

  it('refreshes when the ticket drawer emits its closed event', () => {
    const closed = new Subject<void>();
    const component = Object.create(Tickets.prototype) as any;
    component.drawers = { ticketClosed$: closed.asObservable() };
    component.loadItems = jasmine.createSpy('loadItems');
    component.drawerClosedSubscription = component.drawers.ticketClosed$.subscribe(() => component.loadItems());

    closed.next();

    expect(component.loadItems).toHaveBeenCalledOnceWith();
    component.drawerClosedSubscription.unsubscribe();
  });
});
