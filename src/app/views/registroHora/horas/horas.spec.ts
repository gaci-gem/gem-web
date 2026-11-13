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
      horasTotales: 3.5,
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
    registroHoraServiceSpy = jasmine.createSpyObj<RegistroHoraService>('RegistroHoraService', ['getAll', 'getCategorias', 'getHorasGenerales', 'exportExcel']);
    registroHoraServiceSpy.getCategorias.and.returnValue(of([]));
    registroHoraServiceSpy.getHorasGenerales.and.returnValue(of(mockResponse as any));

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

  it('filtra usuarios sobre el conjunto completo del período', () => {
    const fixture = TestBed.createComponent(Horas);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.usuarioFiltro = 'ana';

    component.consultarRegistros();

    expect(registroHoraServiceSpy.getHorasGenerales).toHaveBeenCalled();
    expect(component.registrosHorasGenerales.length).toBe(0);
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

  it('construye la jerarquía día, usuario y cargas', () => {
    const fixture = TestBed.createComponent(Horas);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.consultarRegistros(new Date('2026-05-01'), new Date('2026-05-31'));

    expect(component.registrosHorasPorDia.length).toBe(1);
    expect(component.registrosHorasPorDia[0].usuarios.length).toBe(1);
    expect(component.registrosHorasPorDia[0].usuarios[0].registros[0].horas?.length).toBe(1);
  });

  it('conserva el total completo del día aunque sus registros provengan de páginas distintas', () => {
    const fixture = TestBed.createComponent(Horas);
    const component = fixture.componentInstance;
    const segundoRegistro = { ...mockResponse[0].registrosHora[0], id: 2, horasTotales: 2.25 };
    registroHoraServiceSpy.getHorasGenerales.and.returnValue(of([{ ...mockResponse[0], registrosHora: [mockResponse[0].registrosHora[0], segundoRegistro] }] as any));

    component.consultarRegistros(new Date('2026-05-01'), new Date('2026-05-31'));

    const dia = component.registrosHorasPorDia[0];
    expect(dia.usuarios[0].registros.length).toBe(2);
    expect(dia.totalHoras).toBe(5.75);
    expect(dia.totalHorasFormateadas).toBe('05:45');
  });

  it('carga los doce meses del año seleccionado en orden y conserva meses sin carga', () => {
    const fixture = TestBed.createComponent(Horas);
    const component = fixture.componentInstance;
    registroHoraServiceSpy.getHorasGenerales.and.returnValue(of([{
      ...mockResponse[0],
      registrosHora: [
        { ...mockResponse[0].registrosHora[0], fecha: '2026-01-15T00:00:00.000Z', horasTotales: 2 },
        { ...mockResponse[0].registrosHora[0], fecha: '2026-12-15T00:00:00.000Z', horasTotales: 4 }
      ]
    }] as any));

    component.cargarComparativaAnual(2026).subscribe(meses => {
      expect(meses).toHaveSize(12);
      expect(meses.map(mes => mes.mes)).toEqual([
        'enero de 2026', 'febrero de 2026', 'marzo de 2026', 'abril de 2026',
        'mayo de 2026', 'junio de 2026', 'julio de 2026', 'agosto de 2026',
        'septiembre de 2026', 'octubre de 2026', 'noviembre de 2026', 'diciembre de 2026'
      ]);
      expect(meses[0].totalHoras).toBe(2);
      expect(meses[1].totalHoras).toBe(0);
      expect(meses[11].totalHoras).toBe(4);
    });

    const [desde, hasta] = registroHoraServiceSpy.getHorasGenerales.calls.mostRecent().args;
    expect(desde).toEqual(new Date(2026, 0, 1));
    expect(hasta).toEqual(new Date(2026, 11, 31));
  });
});
