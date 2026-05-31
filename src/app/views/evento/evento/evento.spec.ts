import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { EventoService } from '@core/services/evento';
import { EventoCompleto } from '@core/interfaces/evento';
import { EstadosEvento } from '@/app/constants/evento_estados';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { Evento } from './evento';

describe('Evento', () => {
  let component: Evento;
  let fixture: ComponentFixture<Evento>;
  let eventoServiceSpy: jasmine.SpyObj<EventoService>;

  const eventoBaseMock: EventoCompleto = {
    id: 'evt-1',
    tipoCodigo: 'CAS',
    numero: 1,
    titulo: 'Evento de prueba',
    cerrado: false,
    estado: EstadosEvento.En_Curso,
    etapaActual: 2,
    usuarioAltaId: 'u-1',
    usuarioActualId: 'u-2',
    facEventoCerr: false,
    clienteId: 1,
    proyectoId: 1,
    productoId: 1,
    moduloCodigo: 'MOD',
    prioridadUsu: 1,
    prioridadCal: 1,
    prioridadFin: 1,
    tipo: {
      codigo: 'CAS',
      descripcion: 'Caso',
      activo: true,
      color: '#000000',
    },
    cliente: {
      id: 1,
      sigla: 'CLI',
      nombre: 'Cliente',
      activo: true,
      critico: false,
    },
    producto: {
      id: 1,
      sigla: 'PROD',
      nombre: 'Producto',
      entornoCodigo: 'WIN',
      activo: true,
      critico: false,
    },
    usuarioAlta: {
      id: 'u-1',
      nombre: 'Alta',
      apellido: 'User',
      usuario: 'ALTA',
      color: '#111111',
    },
    usuarioActual: {
      id: 'u-2',
      nombre: 'Actual',
      apellido: 'User',
      usuario: 'ACTUAL',
      color: '#222222',
    },
    modulo: {
      codigo: 'MOD',
      nombre: 'Modulo',
      padreCodigo: null,
      activo: true,
    },
    proyecto: {
      id: 1,
      sigla: 'PR',
      nombre: 'Proyecto',
      activo: true,
      critico: false,
    },
    registrosHora: [],
    auditorias: [],
    eventosAdicion: [],
    requisitos: [],
    observadores: [],
    documentacion: [],
    etapaActualData: {
      id: 2,
      nombre: 'AUTORIZAR',
      rolPreferido: 'MESA',
      activo: true,
    },
    etapaSiguiente: null,
    etapaAnterior: null,
  };

  beforeEach(async () => {
    (window as any).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    eventoServiceSpy = jasmine.createSpyObj<EventoService>('EventoService', [
      'getEventoVista',
      'getByIdCompleto',
      'getAdjuntos',
      'getRequisitos',
      'getActividad',
      'agregarAdicional',
    ]);

    eventoServiceSpy.getEventoVista.and.callFake(
      (_id: string, opciones?: any) => {
        if (opciones?.incluirActividad)
          return of({ evento: eventoBaseMock, actividad: [] } as any);
        if (opciones?.incluirAdjuntos)
          return of({ evento: eventoBaseMock, adjuntos: [] } as any);
        if (opciones?.incluirRequisitos)
          return of({ evento: eventoBaseMock, requisitos: [] } as any);
        return of({ evento: eventoBaseMock } as any);
      },
    );
    eventoServiceSpy.agregarAdicional.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [Evento],
      providers: [
        { provide: EventoService, useValue: eventoServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: 'evt-1' } } },
        },
        {
          provide: DialogService,
          useValue: {
            open: jasmine
              .createSpy('open')
              .and.returnValue({ onClose: of(null) }),
          },
        },
        {
          provide: DynamicDialogRef,
          useValue: { close: jasmine.createSpy('close') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Evento);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar solo evento base al iniciar', () => {
    expect(eventoServiceSpy.getEventoVista).toHaveBeenCalledWith('evt-1');
    expect(component.evento?.id).toBe('evt-1');
  });

  it('debe cargar actividad de forma lazy', () => {
    component.loadActividad();

    expect(eventoServiceSpy.getEventoVista).toHaveBeenCalledWith('evt-1', {
      incluirActividad: true,
    });
  });

  it('debe cargar adjuntos y requisitos de forma lazy', () => {
    component.loadAdjuntos();
    component.loadRequisitos();

    expect(eventoServiceSpy.getEventoVista).toHaveBeenCalledWith('evt-1', {
      incluirAdjuntos: true,
      adjuntosActivo: 'all',
    });
    expect(eventoServiceSpy.getEventoVista).toHaveBeenCalledWith('evt-1', {
      incluirRequisitos: true,
    });
  });

  it('publicar comentario refresca solo actividad', () => {
    component.onPublicarComentario('Hola');

    expect(eventoServiceSpy.agregarAdicional).toHaveBeenCalled();
    expect(eventoServiceSpy.getEventoVista).toHaveBeenCalledWith('evt-1', {
      incluirActividad: true,
    });
  });
});
