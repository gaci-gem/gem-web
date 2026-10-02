import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';
import { EventoCompleto } from '@core/interfaces/evento';
import { EventoService } from '@core/services/evento';
import { DrawerService } from '@core/services/drawer.service';
import { LoadingService } from '@core/services/loading.service';
import { ViewportService } from '@core/services/viewport.service';
import { UserStorageService } from '@core/services/user-storage';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { EventoSelect } from './evento-select';

describe('EventoSelect', () => {
  let component: EventoSelect;
  let fixture: ComponentFixture<EventoSelect>;
  let eventoService: jasmine.SpyObj<EventoService>;
  let dialogRef: jasmine.SpyObj<DynamicDialogRef>;

  const createEvento = (index: number): EventoCompleto => ({
    evento: `CAS-${String(index).padStart(3, '0')}`,
    titulo: `Título ${index}`,
    cliente: { sigla: 'CLI', nombre: `Cliente ${index}` },
    producto: { sigla: 'PRO', nombre: `Producto ${index}`, entornoCodigo: 'TEST' },
    modulo: { codigo: 'MOD', nombre: index === 2 ? 'Módulo Especial' : `Módulo ${index}` },
  } as EventoCompleto);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EventoSelect],
      providers: [
        {
          provide: EventoService,
          useValue: jasmine.createSpyObj('EventoService', ['getAllComplete', 'getAllCompleteByUsuario']),
        },
        { provide: DrawerService, useValue: { abrirEventoDrawer: jasmine.createSpy('abrirEventoDrawer') } },
        { provide: ViewportService, useValue: { isMobile: () => true } },
        { provide: UserStorageService, useValue: { getUsuario: () => ({ id: 'user-1' }) } },
        { provide: DynamicDialogConfig, useValue: { data: {} } },
        { provide: DynamicDialogRef, useValue: { close: jasmine.createSpy('close') } },
        LoadingService,
        MessageService,
        ConfirmationService,
        provideZonelessChangeDetection(),
      ],
    });

    fixture = TestBed.createComponent(EventoSelect);
    component = fixture.componentInstance;
    eventoService = TestBed.inject(EventoService) as jasmine.SpyObj<EventoService>;
    dialogRef = TestBed.inject(DynamicDialogRef) as jasmine.SpyObj<DynamicDialogRef>;
    eventoService.getAllComplete.and.returnValue(of([]));
    eventoService.getAllCompleteByUsuario.and.returnValue(of([]));
    component.eventos = Array.from({ length: 21 }, (_, index) => createEvento(index + 1));
  });

  it('filters mobile events case-insensitively across event details', () => {
    component.onMobileSearch('mÓDULO eSpEcIaL');

    expect(component.eventosFiltradosMobile.map((evento) => evento.evento)).toEqual(['CAS-002']);
  });

  it('starts with the own-events filter disabled and loads all events', () => {
    component.ngOnInit();

    expect(component.soloMisEventos).toBeFalse();
    expect(eventoService.getAllComplete).toHaveBeenCalledWith(FiltroActivo.ALL);
    expect(eventoService.getAllCompleteByUsuario).not.toHaveBeenCalled();
  });

  it('loads assigned events and resets mobile pagination when the filter changes', () => {
    component.goToMobilePage(1);

    component.onSoloMisEventosChange(true);

    expect(eventoService.getAllCompleteByUsuario).toHaveBeenCalledWith('user-1');
    expect(component.mobilePage()).toBe(0);

    component.onSoloMisEventosChange(false);

    expect(eventoService.getAllComplete).toHaveBeenCalledWith(FiltroActivo.ALL);
    expect(component.mobilePage()).toBe(0);
  });

  it('keeps ten events per mobile page and clamps navigation', () => {
    expect(component.eventosMobilePagina).toHaveSize(10);

    component.goToMobilePage(1);
    expect(component.eventosMobilePagina[0].evento).toBe('CAS-011');

    component.goToMobilePage(99);
    expect(component.eventosMobilePagina).toHaveSize(1);
    expect(component.mobileLastItem).toBe(21);
  });

  it('preserves single selection by submitting immediately', () => {
    component.ngOnInit();
    const submit = spyOn(component, 'submit');
    const event = { id: 'event-1' } as any;

    component.select(event);

    expect(component.eventoSeleccionado).toBe(event);
    expect(submit).toHaveBeenCalled();
  });

  it('toggles and confirms multiple selections', () => {
    component.selectedEventIds = new Set(['event-1']);
    component.eventos = [{ id: 'event-1' }, { id: 'event-2' }] as any;

    component.toggleSelection('event-1');
    component.toggleSelection('event-2');
    component.confirmMultiple();

    expect(component.selectedEventIds).toEqual(new Set(['event-2']));
    expect(dialogRef.close).toHaveBeenCalledWith([{ id: 'event-2' }]);
  });
});
