import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';
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
});
