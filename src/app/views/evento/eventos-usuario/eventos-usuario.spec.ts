import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { EventosUsuario } from './eventos-usuario';
import { SseService } from '@core/services/sse.service';
import { EventoService } from '@core/services/evento';
import {
  UserStorageService,
  UsuarioLogeado,
} from '@core/services/user-storage';
import { LoadingService } from '@core/services/loading.service';
import { PermisosService } from '@core/services/permisos';
import { EventoTrabajoService } from '@core/services/evento-trabajo.service';
import { DrawerService } from '@core/services/drawer.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Notificacion } from '@core/interfaces/notificacion';

describe('EventosUsuario - SSE Refresh', () => {
  let component: EventosUsuario;
  let fixture: ComponentFixture<EventosUsuario>;
  let eventoServiceSpy: jasmine.SpyObj<EventoService>;
  let mockNotifications: WritableSignal<Notificacion[]>;
  let clearTimeoutSpy: jasmine.Spy;
  let setTimeoutSpy: jasmine.Spy;

  const originalSetTimeout = window.setTimeout.bind(window);

  const mockUser: UsuarioLogeado = {
    id: 'u-1',
    nombre: 'Test',
    apellido: 'User',
    email: 'test@test.com',
  };

  function makeNotif(
    targetType?: string,
    overrides: Partial<Notificacion> = {},
  ): Notificacion {
    return {
      mensaje: 'test',
      leida: false,
      createdAt: new Date(),
      ...(targetType !== undefined
        ? { targetType: targetType as Notificacion['targetType'] }
        : {}),
      ...overrides,
    };
  }

  async function initComponent(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    eventoServiceSpy.getAllCompleteByUsuario.calls.reset();
    setTimeoutSpy.calls.reset();
    clearTimeoutSpy.calls.reset();
  }

  function getRefreshCallbacks(): Array<jasmine.CallInfo<typeof setTimeout>> {
    return setTimeoutSpy.calls.all().filter((c) => c.args[1] === 2000);
  }

  function invokeRefreshCallback(): void {
    const refreshCalls = getRefreshCallbacks();
    if (refreshCalls.length === 0) {
      fail('No refresh timeout was scheduled');
    }
    (refreshCalls[0].args[0] as Function)();
  }

  beforeEach(async () => {
    (window as any).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    mockNotifications = signal<Notificacion[]>([]);

    const sseServiceMock: Partial<SseService> = {
      notifications: mockNotifications as unknown as WritableSignal<
        Notificacion[]
      >,
    };

    eventoServiceSpy = jasmine.createSpyObj<EventoService>('EventoService', [
      'getAllCompleteByUsuario',
    ]);
    eventoServiceSpy.getAllCompleteByUsuario.and.returnValue(of([]));

    const userStorageServiceSpy: Partial<UserStorageService> = {
      getUsuario: jasmine.createSpy('getUsuario').and.returnValue(mockUser),
    };

    const loadingServiceSpy = jasmine.createSpyObj<LoadingService>(
      'LoadingService',
      ['show', 'hide'],
    );

    const permisosServiceSpy = jasmine.createSpyObj<PermisosService>(
      'PermisosService',
      ['can'],
    );
    permisosServiceSpy.can.and.returnValue(true);

    const eventoTrabajoServiceSpy = jasmine.createSpyObj<EventoTrabajoService>(
      'EventoTrabajoService',
      [
        'setEventoEnTrabajo',
        'limpiarEvento',
        'getEventoEnTrabajo',
        'getTiempoInicio',
      ],
    );
    Object.defineProperty(eventoTrabajoServiceSpy, 'eventoEnTrabajo$', {
      get: () => of(null),
    });
    Object.defineProperty(eventoTrabajoServiceSpy, 'tiempoInicio$', {
      get: () => of(null),
    });

    const drawerServiceSpy = jasmine.createSpyObj<DrawerService>(
      'DrawerService',
      [
        'abrirEventoDrawer',
        'cerrarEventoDrawer',
        'abrirUsuarioDrawer',
        'cerrarUsuarioDrawer',
        'abrirNotaDrawer',
        'cerrarNotaDrawer',
      ],
    );

    const messageServiceMock: Partial<MessageService> = {
      add: jasmine.createSpy('add'),
      messageObserver: new Subject<any>().asObservable(),
      clear: jasmine.createSpy('clear'),
    };
    const confirmationServiceMock: Partial<ConfirmationService> = {
      confirm: jasmine.createSpy('confirm'),
      requireConfirmation$: new Subject<any>().asObservable(),
    };
    const dialogServiceSpy = jasmine.createSpyObj<DialogService>(
      'DialogService',
      ['open'],
    );

    await TestBed.configureTestingModule({
      imports: [EventosUsuario],
      providers: [
        { provide: SseService, useValue: sseServiceMock },
        { provide: EventoService, useValue: eventoServiceSpy },
        { provide: UserStorageService, useValue: userStorageServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: PermisosService, useValue: permisosServiceSpy },
        { provide: EventoTrabajoService, useValue: eventoTrabajoServiceSpy },
        { provide: DrawerService, useValue: drawerServiceSpy },
        { provide: MessageService, useValue: messageServiceMock },
        { provide: ConfirmationService, useValue: confirmationServiceMock },
        { provide: DialogService, useValue: dialogServiceSpy },
      ],
    })
      .overrideComponent(EventosUsuario, {
        set: { providers: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EventosUsuario);
    component = fixture.componentInstance;

    let fakeId = 1000;
    setTimeoutSpy = spyOn(window, 'setTimeout').and.callFake(
      (fn: TimerHandler, delay?: number, ...args: any[]) => {
        if (delay === 2000) return ++fakeId;
        return originalSetTimeout(fn, delay ?? 0, ...args);
      },
    );

    clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
  });

  it('1. EVENTO notification triggers refresh after throttle window', async () => {
    await initComponent();

    mockNotifications.set([makeNotif('EVENTO')]);

    expect(getRefreshCallbacks().length).toBe(1);
    invokeRefreshCallback();

    expect(eventoServiceSpy.getAllCompleteByUsuario).toHaveBeenCalled();
  });

  it('2. Empty notifications signal does not trigger refresh', async () => {
    await initComponent();

    mockNotifications.set([]);

    expect(getRefreshCallbacks().length).toBe(0);
    expect(eventoServiceSpy.getAllCompleteByUsuario).not.toHaveBeenCalled();
  });

  it('3. Non-EVENTO notification (COMENTARIO) does not trigger refresh', async () => {
    await initComponent();

    mockNotifications.set([makeNotif('COMENTARIO')]);

    expect(getRefreshCallbacks().length).toBe(0);
    expect(eventoServiceSpy.getAllCompleteByUsuario).not.toHaveBeenCalled();
  });

  it('4. Notification with undefined targetType does not trigger refresh', async () => {
    await initComponent();

    mockNotifications.set([makeNotif(undefined)]);

    expect(getRefreshCallbacks().length).toBe(0);
    expect(eventoServiceSpy.getAllCompleteByUsuario).not.toHaveBeenCalled();
  });

  it('5. Throttle collapses duplicate EVENTO notifications within 2s window', async () => {
    await initComponent();

    mockNotifications.set([makeNotif('EVENTO')]);
    mockNotifications.set([makeNotif('EVENTO')]);

    expect(getRefreshCallbacks().length).toBe(1);
    invokeRefreshCallback();
    expect(eventoServiceSpy.getAllCompleteByUsuario).toHaveBeenCalledTimes(1);
  });

  it('6. Throttle allows new refresh after window expires', async () => {
    await initComponent();

    mockNotifications.set([makeNotif('EVENTO')]);
    invokeRefreshCallback();
    expect(eventoServiceSpy.getAllCompleteByUsuario).toHaveBeenCalledTimes(1);
    eventoServiceSpy.getAllCompleteByUsuario.calls.reset();

    mockNotifications.set([makeNotif('EVENTO')]);
    expect(getRefreshCallbacks().length).toBe(2);
    invokeRefreshCallback();
    expect(eventoServiceSpy.getAllCompleteByUsuario).toHaveBeenCalledTimes(1);
  });

  it('7. ngOnDestroy clears pending timeout and prevents refresh', async () => {
    await initComponent();

    mockNotifications.set([makeNotif('EVENTO')]);
    expect(getRefreshCallbacks().length).toBe(1);

    clearTimeoutSpy.calls.reset();
    fixture.destroy();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(eventoServiceSpy.getAllCompleteByUsuario).not.toHaveBeenCalled();
  });

  it('8. ngOnDestroy with no pending timeout does not error', async () => {
    await initComponent();

    expect(() => {
      fixture.destroy();
    }).not.toThrow();

    expect(eventoServiceSpy.getAllCompleteByUsuario).not.toHaveBeenCalled();
  });
});
