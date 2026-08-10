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
import { EventoSelect } from './evento-select';

describe('EventoSelect', () => {
  let component: EventoSelect;
  let fixture: ComponentFixture<EventoSelect>;

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
        { provide: EventoService, useValue: { getAllComplete: () => of([]) } },
        { provide: DrawerService, useValue: { abrirEventoDrawer: jasmine.createSpy('abrirEventoDrawer') } },
        { provide: ViewportService, useValue: { isMobile: () => true } },
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
    component.eventos = Array.from({ length: 21 }, (_, index) => createEvento(index + 1));
  });

  it('filters mobile events case-insensitively across event details', () => {
    component.onMobileSearch('mÓDULO eSpEcIaL');

    expect(component.eventosFiltradosMobile.map((evento) => evento.evento)).toEqual(['CAS-002']);
  });

  it('keeps ten events per mobile page and clamps navigation', () => {
    expect(component.eventosMobilePagina).toHaveSize(10);

    component.goToMobilePage(1);
    expect(component.eventosMobilePagina[0].evento).toBe('CAS-011');

    component.goToMobilePage(99);
    expect(component.eventosMobilePagina).toHaveSize(1);
    expect(component.mobileLastItem).toBe(21);
  });
});
