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
import { EventoAccionesService } from '@core/services/evento-acciones';
import { DrawerService } from '@core/services/drawer.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Notificacion } from '@core/interfaces/notificacion';
import { FiltroPresetService } from '@core/services/filtro-preset';
import { FiltroPreset } from '@core/interfaces/filtro-preset';

describe('EventosUsuario - SSE Refresh', () => {
  let component: EventosUsuario;
  let fixture: ComponentFixture<EventosUsuario>;
  let eventoServiceSpy: jasmine.SpyObj<EventoService>;
  let filtroPresetServiceSpy: jasmine.SpyObj<FiltroPresetService>;
  let drawerServiceSpy: jasmine.SpyObj<DrawerService>;
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
    eventoServiceSpy.getAllCompleteByUsuario.and.returnValue(of({
      data: [], total: 0, page: 1, limit: 10, totalPages: 0,
    } as any));

    filtroPresetServiceSpy = jasmine.createSpyObj<FiltroPresetService>(
      'FiltroPresetService',
      ['list', 'create', 'update', 'remove', 'setDefault'],
    );
    filtroPresetServiceSpy.list.and.returnValue(of([]));

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

    const eventoAccionesServiceSpy = jasmine.createSpyObj<EventoAccionesService>(
      'EventoAccionesService', ['obtenerEventoEnTrabajo'],
    );
    eventoAccionesServiceSpy.obtenerEventoEnTrabajo.and.returnValue(of(null as any));

    drawerServiceSpy = jasmine.createSpyObj<DrawerService>(
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
        { provide: FiltroPresetService, useValue: filtroPresetServiceSpy },
        { provide: UserStorageService, useValue: userStorageServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: PermisosService, useValue: permisosServiceSpy },
        { provide: EventoTrabajoService, useValue: eventoTrabajoServiceSpy },
        { provide: EventoAccionesService, useValue: eventoAccionesServiceSpy },
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

  it('9. applying a preset loads and renders the result once', async () => {
    await initComponent();
    eventoServiceSpy.getAllCompleteByUsuario.calls.reset();

    const preset: FiltroPreset = {
      id: 'preset-1',
      nombre: 'Mis eventos',
      filtros: { filtroActivo: 'all', fecha: null, globalFilter: '' },
      esDefault: false,
      createdAt: '',
      updatedAt: '',
    };
    const evento = {
      id: 'evento-1',
      numero: 1,
      titulo: 'Resultado del preset',
      tipo: { codigo: 'TST', color: '#000', propio: false },
    } as any;
    component.presets.set([preset]);
    eventoServiceSpy.getAllCompleteByUsuario.and.returnValue(of({
      data: [evento], total: 1, page: 1, limit: 10, totalPages: 1,
    } as any));

    (component as any).applyPreset(preset.id);
    fixture.detectChanges();

    expect(eventoServiceSpy.getAllCompleteByUsuario).toHaveBeenCalledTimes(1);
    expect(component.eventos).toHaveSize(1);
    expect(fixture.nativeElement.textContent).toContain('Resultado del preset');
  });

  it('10. context menu actions use the currently selected event', () => {
    const eventoA = { id: 'CAS-009' } as any;
    const eventoB = { id: 'CUS-003' } as any;

    component.buildContextMenu(eventoA);
    component.menuItems[0].command?.({} as any);
    component.buildContextMenu(eventoB);
    component.menuItems[0].command?.({} as any);

    expect(drawerServiceSpy.abrirEventoDrawer).toHaveBeenCalledWith('CAS-009');
    expect(drawerServiceSpy.abrirEventoDrawer).toHaveBeenCalledWith('CUS-003');
  });

  it('11. clearing filters resets date, table order, page and persists clean state once', async () => {
    await initComponent();
    eventoServiceSpy.getAllCompleteByUsuario.calls.reset();

    component.filtroFecha = [new Date(2026, 0, 1), new Date(2026, 0, 31)];
    component.filtroActivo = 'all' as any;
    component.globalFilter = 'old search';
    component.searchValue.set('old search');

    const table = {
      clear: jasmine.createSpy('clear'),
      sortField: 'prioridad',
      sortOrder: -1,
      first: 20,
      rows: 10,
      filters: { titulo: [{ value: 'old', matchMode: 'contains' }] },
    } as any;

    component.clear(table);

    expect(table.clear).toHaveBeenCalledTimes(1);
    expect(table.sortField).toBeNull();
    expect(table.sortOrder).toBe(0);
    expect(table.first).toBe(0);
    expect(component.filtroFecha).toBeNull();
    expect(component.filtroActivo).toBe('true');
    expect(component.searchValue()).toBe('');
    expect(component.globalFilter).toBe('');
    expect((component as any).captureFilterState()).toEqual(jasmine.objectContaining({
      fecha: null,
      sortField: null,
      sortOrder: 0,
      first: 0,
      globalFilter: '',
    }));
    expect(eventoServiceSpy.getAllCompleteByUsuario).toHaveBeenCalledTimes(1);
  });

  it('12. table filters reset the paginator and reload the server page', async () => {
    await initComponent();
    eventoServiceSpy.getAllCompleteByUsuario.calls.reset();
    component.table = { first: 20, rows: 10, filters: { titulo: [{ value: 'incident', matchMode: 'contains' }] } } as any;

    component.onTableFilter({ filters: component.table.filters } as any);

    expect(component.table.first).toBe(0);
    expect(eventoServiceSpy.getAllCompleteByUsuario).toHaveBeenCalledWith('u-1', jasmine.objectContaining({
      page: 1,
      limit: 10,
      titulo: 'incident',
    }));
  });

  it('13. paginator changes request the selected server page and preserve totals', async () => {
    await initComponent();
    eventoServiceSpy.getAllCompleteByUsuario.calls.reset();
    eventoServiceSpy.getAllCompleteByUsuario.and.returnValue(of({
      data: [], total: 27, page: 3, limit: 10, totalPages: 3,
    } as any));
    component.table = { first: 0, rows: 10, filters: {} } as any;

    component.onTablePage({ first: 20, rows: 10 } as any);

    expect(eventoServiceSpy.getAllCompleteByUsuario).toHaveBeenCalledWith('u-1', jasmine.objectContaining({ page: 3, limit: 10 }));
    expect(component.totalEventos).toBe(27);
  });

});
