import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Horas } from './horas';
import { RegistroHoraService } from '@core/services/registro-hora';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { FiltroPresetService } from '@core/services/filtro-preset';

describe('Horas', () => {
  let registroHoraServiceSpy: jasmine.SpyObj<RegistroHoraService>;

  const mockResponse = [{
    id: 'u-1',
    nombre: 'Test',
    apellido: 'User',
    usuario: 'TEST',
    registrosHora: [{
      id: 1,
      fecha: '2026-05-27T00:00:00.000Z',
      usuarioId: 'u-1',
      horas: [{
        id: 42,
        eventoId: 'evt-1',
        inicio: '09:00',
        fin: '12:30',
        detalle: 'Testing',
        categoriaCodigo: 'DEV',
        categoria: { codigo: 'DEV', descripcion: 'Desarrollo', color: '#2196F3' },
      }],
    }],
  }];

  beforeEach(async () => {
    registroHoraServiceSpy = jasmine.createSpyObj<RegistroHoraService>('RegistroHoraService', ['getAll', 'getCategorias', 'exportExcel']);
    registroHoraServiceSpy.getAll.and.returnValue(of({ data: mockResponse[0].registrosHora, pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } }) as any);
    registroHoraServiceSpy.getCategorias.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [Horas],
      providers: [
        { provide: RegistroHoraService, useValue: registroHoraServiceSpy },
        DialogService,
        MessageService,
        ConfirmationService,
        { provide: FiltroPresetService, useValue: { list: () => of([]) } },
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  it('should map categoria from response', () => {
    const fixture = TestBed.createComponent(Horas);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.consultarRegistros(new Date('2026-05-01'), new Date('2026-05-31'));

    expect(component.registrosHorasGenerales.length).toBe(1);
    const hora = component.registrosHorasGenerales[0].horas?.[0];
    expect(hora?.categoriaCodigo).toBe('DEV');
    expect(hora?.categoria?.descripcion).toBe('Desarrollo');
    expect(hora?.categoria?.color).toBe('#2196F3');
  });

  it('debe enviar buscar y no usuario para el filtro general', () => {
    const fixture = TestBed.createComponent(Horas);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.usuarioFiltro = 'ana';

    component.consultarRegistros();

    expect(registroHoraServiceSpy.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ buscar: 'ana' }));
    const query = registroHoraServiceSpy.getAll.calls.mostRecent().args[0] as Record<string, unknown>;
    expect(query['usuario']).toBeUndefined();
  });

  it('expande y contrae registros de forma independiente con claves estables', () => {
    const fixture = TestBed.createComponent(Horas);
    const component = fixture.componentInstance;
    const primero = { ...mockResponse[0].registrosHora[0], usuarioId: 'u-1' } as any;
    const segundo = { ...primero, id: 2 } as any;

    component.toggleRegistro(primero);
    expect(component.isRegistroExpandido(primero)).toBeTrue();
    expect(component.isRegistroExpandido(segundo)).toBeFalse();

    component.toggleRegistro(segundo);
    expect(component.isRegistroExpandido(primero)).toBeTrue();
    expect(component.isRegistroExpandido(segundo)).toBeTrue();

    component.toggleRegistro(primero);
    expect(component.isRegistroExpandido(primero)).toBeFalse();
    expect(component.isRegistroExpandido(segundo)).toBeTrue();
  });
});
