import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { EventoV2HeaderComponent } from './evento-v2-header';
import { EventoService } from '@core/services/evento';
import { DrawerService } from '@core/services/drawer.service';
import { UserStorageService } from '@core/services/user-storage';

describe('EventoV2HeaderComponent', () => {
  let component: EventoV2HeaderComponent;
  let eventoService: jasmine.SpyObj<EventoService>;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    eventoService = jasmine.createSpyObj('EventoService', ['update']);
    messageService = jasmine.createSpyObj('MessageService', ['add']);

    TestBed.configureTestingModule({
      providers: [
        { provide: EventoService, useValue: eventoService },
        { provide: MessageService, useValue: messageService },
        { provide: DrawerService, useValue: jasmine.createSpyObj('DrawerService', ['abrirUsuarioDrawer']) },
        { provide: UserStorageService, useValue: jasmine.createSpyObj('UserStorageService', ['getUsuario']) },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jasmine.createSpy('detectChanges') } },
      ],
    });

    component = TestBed.runInInjectionContext(() => new EventoV2HeaderComponent());
    component.evento = {
      id: 'evento-1',
      fechaCierre: '2026-01-05T00:00:00.000Z',
      fechaFinEst: null,
      fechaEntrega: null,
      fechaEntregaReal: null,
    } as any;
  });

  it('envía únicamente el id y la fecha editable, sin fechaCierre', () => {
    eventoService.update.and.returnValue(of({} as any));

    component.onFechaChange('2026-02-01', 'fechaFinEst');

    expect(eventoService.update).toHaveBeenCalledWith('evento-1', jasmine.objectContaining({
      id: 'evento-1',
      fechaFinEst: '2026-02-01T00:00:00.000Z',
    }) as any);
    expect(eventoService.update.calls.mostRecent().args[1]).not.toEqual(jasmine.objectContaining({ fechaCierre: jasmine.anything() }));
  });

  it('muestra el mensaje del backend en el toast común ante un error', () => {
    eventoService.update.and.returnValue(throwError(() => ({ error: { message: 'property fechaCierre should not exist' } })));

    component.onFechaChange('2026-02-01', 'fechaEntrega');

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      detail: 'property fechaCierre should not exist',
    }));
  });
});
