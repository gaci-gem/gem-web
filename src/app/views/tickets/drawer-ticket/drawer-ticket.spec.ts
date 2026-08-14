import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DrawerTicket } from './drawer-ticket';
import { TicketService } from '@core/services/ticket';
import { DrawerService } from '@core/services/drawer.service';
import { EventoService } from '@core/services/evento';
import { PermisosService } from '@core/services/permisos';

describe('DrawerTicket', () => {
  let fixture: ComponentFixture<DrawerTicket>;
  const service = jasmine.createSpyObj<TicketService>('TicketService', ['detail', 'associateEvent']);
  const eventoService = jasmine.createSpyObj<EventoService>('EventoService', ['getAllComplete']);
  const drawerService = jasmine.createSpyObj<DrawerService>('DrawerService', ['abrirEventoDrawer']);
  const permissions = jasmine.createSpyObj<PermisosService>('PermisosService', ['can']);

  beforeEach(async () => {
    service.detail.and.returnValue(of({
      id: 7, subject: 'Subject', description: 'Description', status: 'INGRESADO',
       externalReference: 'EXT-7', clientName: 'Client', clientCode: 'CLI', clientId: 11,
       createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', comments: [], events: [{ id: 'event-7', type: 'TIP01', code: '7', title: 'Event', visibleState: 'OPEN', color: '#123456' }],
    }));
    service.associateEvent.and.returnValue(of({} as any));
    eventoService.getAllComplete.and.returnValue(of([]));
    permissions.can.and.returnValue(true);
    await TestBed.configureTestingModule({
      imports: [DrawerTicket],
      providers: [
        { provide: TicketService, useValue: service },
        { provide: DrawerService, useValue: drawerService },
        { provide: EventoService, useValue: eventoService },
        { provide: PermisosService, useValue: permissions },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DrawerTicket);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('ticketId', '7');
    fixture.detectChanges();
  });

  it('loads and renders ticket data without management controls', () => {
    expect(service.detail).toHaveBeenCalledWith(7);
    expect(fixture.componentInstance.ticket?.subject).toBe('Subject');
    expect(fixture.componentInstance.ticket?.externalReference).toBe('EXT-7');
    expect(fixture.nativeElement.querySelectorAll('input, textarea, select').length).toBe(0);
  });

  it('opens the standard event drawer when a related event badge is clicked', () => {
    fixture.nativeElement.querySelector('app-badge-click').click();

    expect(drawerService.abrirEventoDrawer).toHaveBeenCalledWith('event-7');
  });

  it('associates a client event and updates the ticket events immediately', () => {
    const event = {
      id: 'event-8', tipoCodigo: 'TIP02', numero: 8, titulo: 'Existing event', cerrado: false,
      clienteId: 11, tipo: { color: '#654321' },
    } as any;
    eventoService.getAllComplete.and.returnValue(of([event]));

    fixture.componentInstance.openEventAssociation();
    fixture.componentInstance.associateEvent(event);

    expect(service.associateEvent).toHaveBeenCalledWith(7, 'event-8');
    expect(fixture.componentInstance.ticket?.events.map((item) => item.id)).toEqual(['event-7', 'event-8']);
  });
});
