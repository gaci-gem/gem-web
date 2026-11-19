import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { HoraCrud } from './hora-crud';
import { EventoService } from '@core/services/evento';
import { RegistroHoraService } from '@core/services/registro-hora';
import { UserStorageService } from '@core/services/user-storage';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { ViewportService } from '@core/services/viewport.service';
import { Hora } from '@core/interfaces/registro-hora';

describe('HoraCrud', () => {
  let component: HoraCrud;
  let fixture: ComponentFixture<HoraCrud>;
  let eventoServiceSpy: jasmine.SpyObj<EventoService>;
  let registroHoraServiceSpy: jasmine.SpyObj<RegistroHoraService>;
  let dialogRefSpy: jasmine.SpyObj<DynamicDialogRef>;
  let mobileSignal = signal(false);

  const mockConfig: any = {
    data: {
      item: null,
      modo: 'A',
    },
  };

  beforeEach(async () => {
    eventoServiceSpy = jasmine.createSpyObj<EventoService>('EventoService', ['getAll']);
    eventoServiceSpy.getAll.and.returnValue(of([]));

    registroHoraServiceSpy = jasmine.createSpyObj<RegistroHoraService>('RegistroHoraService', ['getCategorias', 'obtenerHorasDelDia']);
    registroHoraServiceSpy.getCategorias.and.returnValue(of([]));
    registroHoraServiceSpy.obtenerHorasDelDia.and.returnValue(of({ fecha: '2026-11-17', horas: [] }));
    dialogRefSpy = jasmine.createSpyObj<DynamicDialogRef>('DynamicDialogRef', ['close']);
    mobileSignal = signal(false);

    await TestBed.configureTestingModule({
      imports: [HoraCrud],
      providers: [
        { provide: EventoService, useValue: eventoServiceSpy },
        { provide: DynamicDialogConfig, useValue: mockConfig },
        { provide: DynamicDialogRef, useValue: dialogRefSpy },
        { provide: DialogService, useValue: {} },
        { provide: RegistroHoraService, useValue: registroHoraServiceSpy },
        { provide: ViewportService, useValue: { isMobile: mobileSignal } },
        {
          provide: UserStorageService,
          useValue: { getUsuario: () => ({ id: 'u-1', nombre: 'Test', apellido: 'User', usuario: 'TEST' }) },
        },
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HoraCrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('toModel() should include categoriaCodigo when set', () => {
    (component as any).buildForm();
    component.addHora();

    const horaForm = component.horasFormArray.at(0);
    horaForm.get('categoriaCodigo')?.setValue('DEV');

    const model = component['toModel']();
    expect(model.horas?.[0].categoriaCodigo).toBe('DEV');
  });

  it('toModel() should emit null categoriaCodigo when not set', () => {
    (component as any).buildForm();
    component.addHora();

    const model = component['toModel']();
    expect(model.horas?.[0].categoriaCodigo).toBeNull();
  });

  it('should preload categoriaCodigo on first hora when categoriaSugerida is provided', () => {
    const configWithSugerida: any = {
      data: {
        item: null,
        modo: 'A',
        categoriaSugerida: { codigo: 'TEST', descripcion: 'Testing', color: '#4CAF50' },
      },
    };

    TestBed.resetTestingModule();
    eventoServiceSpy = jasmine.createSpyObj<EventoService>('EventoService', ['getAll']);
    eventoServiceSpy.getAll.and.returnValue(of([]));

    registroHoraServiceSpy = jasmine.createSpyObj<RegistroHoraService>('RegistroHoraService', ['getCategorias', 'obtenerHorasDelDia']);
    registroHoraServiceSpy.getCategorias.and.returnValue(of([]));
    registroHoraServiceSpy.obtenerHorasDelDia.and.returnValue(of({ fecha: '2026-11-17', horas: [] }));

    TestBed.configureTestingModule({
      imports: [HoraCrud],
      providers: [
        { provide: EventoService, useValue: eventoServiceSpy },
        { provide: DynamicDialogConfig, useValue: configWithSugerida },
        { provide: DynamicDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: DialogService, useValue: {} },
        { provide: RegistroHoraService, useValue: registroHoraServiceSpy },
        { provide: UserStorageService, useValue: { getUsuario: () => ({ id: 'u-1' }) } },
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HoraCrud);
    component = fixture.componentInstance;
    fixture.detectChanges();

    (component as any).buildForm();
    component.addHora();

    const horaForm = component.horasFormArray.at(0);
    expect(horaForm.get('categoriaCodigo')?.value).toBe('TEST');
  });

  it('should preload the event on the first interval when opened from an event', () => {
    const configWithEvent: any = {
      data: {
        item: null,
        modo: 'A',
        modoCargaDesdeEvento: true,
        eventoIdPreseleccionado: 'evt-1',
      },
    };

    TestBed.resetTestingModule();
    eventoServiceSpy = jasmine.createSpyObj<EventoService>('EventoService', ['getAll', 'getByIdCompleto']);
    eventoServiceSpy.getAll.and.returnValue(of([]));
    eventoServiceSpy.getByIdCompleto.and.returnValue(of({
      id: 'evt-1',
      categoriaSugerida: { codigo: 'ETAPA', descripcion: 'Etapa', color: '#123456' },
    } as any));
    registroHoraServiceSpy = jasmine.createSpyObj<RegistroHoraService>('RegistroHoraService', ['getCategorias', 'obtenerHorasDelDia']);
    registroHoraServiceSpy.getCategorias.and.returnValue(of([]));
    registroHoraServiceSpy.obtenerHorasDelDia.and.returnValue(of({ fecha: '2026-11-17', horas: [] }));

    TestBed.configureTestingModule({
      imports: [HoraCrud],
      providers: [
        { provide: EventoService, useValue: eventoServiceSpy },
        { provide: DynamicDialogConfig, useValue: configWithEvent },
        { provide: DynamicDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: DialogService, useValue: {} },
        { provide: ViewportService, useValue: { isMobile: mobileSignal } },
        { provide: RegistroHoraService, useValue: registroHoraServiceSpy },
        { provide: UserStorageService, useValue: { getUsuario: () => ({ id: 'u-1' }) } },
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HoraCrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.addHora();

    expect(component.horasFormArray.at(0).get('eventoId')?.value).toBe('evt-1');
    expect(eventoServiceSpy.getByIdCompleto).toHaveBeenCalledOnceWith('evt-1');
    expect(component.horasFormArray.at(0).get('categoriaCodigo')?.value).toBe('ETAPA');
  });

  it('applies the category suggested by the event stage only when the first interval is empty', () => {
    const suggestion = { codigo: 'ETAPA', descripcion: 'Etapa', color: '#123456' };
    eventoServiceSpy = jasmine.createSpyObj<EventoService>('EventoService', ['getAll', 'getByIdCompleto']);
    eventoServiceSpy.getAll.and.returnValue(of([]));
    eventoServiceSpy.getByIdCompleto.and.returnValue(of({ categoriaSugerida: suggestion } as any));

    (component as any).eventoService = eventoServiceSpy;
    (component as any).esCargaContextual = true;
    (component as any).buildForm();
    component.addHora();
    (component as any).cargarCategoriaSugeridaDeEvento('evt-1');

    expect(component.horasFormArray.at(0).get('categoriaCodigo')?.value).toBe('ETAPA');
    expect(eventoServiceSpy.getByIdCompleto).toHaveBeenCalledOnceWith('evt-1');
  });

  it('resolves the category suggested by the current nested stage', () => {
    const suggestion = { codigo: 'ETAPA', descripcion: 'Etapa', color: '#123456' };
    eventoServiceSpy = jasmine.createSpyObj<EventoService>('EventoService', ['getByIdCompleto']);
    eventoServiceSpy.getByIdCompleto.and.returnValue(of({
      etapaActualData: { etapa: { categoriaSugerida: suggestion } },
    } as any));
    (component as any).eventoService = eventoServiceSpy;
    (component as any).esCargaContextual = true;
    (component as any).buildForm();
    component.addHora();

    (component as any).cargarCategoriaSugeridaDeEvento('evt-1');

    expect(component.categoriaSugerida).toEqual({ ...suggestion, activo: true });
    expect(component.horasFormArray.at(0).get('categoriaCodigo')?.value).toBe('ETAPA');
  });

  it('does not overwrite a manually selected category', () => {
    const suggestion = { codigo: 'ETAPA', descripcion: 'Etapa', color: '#123456' };
    eventoServiceSpy = jasmine.createSpyObj<EventoService>('EventoService', ['getByIdCompleto']);
    eventoServiceSpy.getByIdCompleto.and.returnValue(of({ categoriaSugerida: suggestion } as any));
    (component as any).eventoService = eventoServiceSpy;
    (component as any).esCargaContextual = true;
    (component as any).buildForm();
    component.addHora();
    component.horasFormArray.at(0).get('categoriaCodigo')?.setValue('MANUAL');

    (component as any).cargarCategoriaSugeridaDeEvento('evt-1');

    expect(component.horasFormArray.at(0).get('categoriaCodigo')?.value).toBe('MANUAL');
  });

  it('should set categoriaCodigo to null when populateForm has no categoria', () => {
    (component as any).buildForm();
    (component as any).populateForm({
      id: 1,
      fecha: new Date('2026-05-27'),
      usuarioId: 'u-1',
      horas: [{
        eventoId: 'evt-1',
        inicio: '09:00',
        fin: '12:00',
      }],
    });

    const horaForm = component.horasFormArray.at(0);
    expect(horaForm.get('categoriaCodigo')?.value).toBeNull();
  });

  it('should select the explicit mobile composition from the viewport state', () => {
    mobileSignal.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mobile-hours-editor')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.hora-form > .col-12.border')).toBeNull();
  });

  it('should keep the form open and mark validation errors when saving an invalid range', () => {
    (component as any).buildForm();
    component.addHora();
    const horaForm = component.horasFormArray.at(0);
    horaForm.patchValue({ inicio: new Date(2026, 4, 27, 12, 0), fin: new Date(2026, 4, 27, 11, 0) });
    horaForm.updateValueAndValidity();

    component.accion(new Event('submit'));

    expect(horaForm.errors?.['invalidTimeRange']).toBeTrue();
    expect(horaForm.touched).toBeTrue();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('formats interval times as HH:mm without the Date portion', () => {
    expect(component.formatControlTime(new Date(1970, 0, 1, 8, 5))).toBe('08:05');
    expect(component.formatControlTime('1970-01-01T17:30:00')).toBe('17:30');
  });

  it('formats backend UTC interval times unchanged in UTC-3 local time', () => {
    expect(component.formatBackendTime(new Date('1970-01-01T10:00:00Z'))).toBe('10:00');
    expect(component.formatBackendTime(new Date('1970-01-01T11:00:00Z'))).toBe('11:00');
  });

  it('formats event labels with identifier and title, using a safe fallback', () => {
    expect(component.formatEventoLabel({ tipoCodigo: 'INC', numero: 7, titulo: 'Pantalla' })).toBe('INC-007 | Pantalla');
    expect(component.formatEventoLabel(undefined, 'evt-1')).toBe('evt-1');
  });

  it('formats the contextual event with the nested type identifier and title', () => {
    (component as any).config.data = {
      ...mockConfig.data,
      evento: { tipo: { codigo: 'INC' }, numero: 7, titulo: 'Pantalla' },
      eventoIdPreseleccionado: 'evt-1',
    };

    expect(component.contextualEventoLabel()).toBe('INC-007 | Pantalla');
  });

  it('keeps the contextual category empty when there is no suggestion', () => {
    (component as any).esCargaContextual = true;
    (component as any).categoriaSugerida = null;
    (component as any).buildForm();
    component.addHora();

    expect(component.horasFormArray.at(0).get('categoriaCodigo')?.value).toBeNull();
  });

  it('calculates a read-only duration from the interval times', () => {
    expect(component.formatDuration('09:15', '10:45')).toBe('1h 30m');
    expect(component.formatDuration('09:15', null)).toBe('—');
    expect(Object.prototype.hasOwnProperty.call(component['toModel'](), 'duracion')).toBeFalse();
  });

  it('renders the new interval fields in the shared order', () => {
    (component as any).esCargaContextual = false;
    component.addHora();
    fixture.detectChanges();
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.mobile-hour-card label'))
      .map((label: any) => label.textContent.trim());
    expect(labels.slice(0, 6)).toEqual(['Evento', 'Inicio', 'Fin', 'Categoría', 'Detalle', 'Duración']);
  });

  it('resolves the existing interval category with its color and description', () => {
    component.categorias = [{ codigo: 'DEV', descripcion: 'Desarrollo', color: '#4CAF50', activo: true }];
    const hora: Hora = {
      id: 1,
      eventoId: 'evt-1',
      inicio: '09:00',
      fin: '10:00',
      categoriaCodigo: 'DEV',
    };

    expect(component.categoriaInfo(hora)).toEqual(component.categorias[0]);
  });

  it('hides the contextual date field while preserving its value for saving', () => {
    (component as any).esCargaContextual = true;
    component.form.get('fecha')?.disable({ emitEvent: false });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#fecha[type="date"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="fecha-contextual"]')).toBeNull();
    expect(component.form.get('fecha')?.value).toBeTruthy();
  });

  it('shows the preserved contextual date in the dialog title without changing its value', () => {
    (component as any).esCargaContextual = true;
    component.form.get('fecha')?.setValue('2026-11-17');
    (component as any).actualizarTituloContextual();

    expect((component as any).config.header).toBe('Cargar registro Hora — 17-11-2026');
    expect(component.form.get('fecha')?.value).toBe('2026-11-17');
  });

  it('keeps the new interval fields in one desktop row structure', () => {
    (component as any).esCargaContextual = false;
    component.addHora();
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('.mobile-hour-card');
    expect(row).not.toBeNull();
    expect(row.classList.contains('row')).toBeTrue();
    expect(row.querySelectorAll(':scope > div').length).toBeGreaterThanOrEqual(5);
  });

  it('should preserve the overlap validation between intervals', () => {
    (component as any).buildForm();
    component.addHora();
    component.addHora();
    component.horasFormArray.at(0).patchValue({ inicio: new Date(2026, 4, 27, 9, 0), fin: new Date(2026, 4, 27, 12, 0) });
    component.horasFormArray.at(1).patchValue({ inicio: new Date(2026, 4, 27, 11, 0), fin: new Date(2026, 4, 27, 13, 0) });
    component.horasFormArray.updateValueAndValidity();

    expect(component.horasFormArray.errors?.['overlap']).toBeTrue();
  });

  it('removes the middle interval while preserving the first and last controls', () => {
    component.addHora();
    component.addHora();
    component.addHora();

    const first = component.horasFormArray.at(0);
    const middle = component.horasFormArray.at(1);
    const last = component.horasFormArray.at(2);
    first.get('eventoId')?.setValue('first');
    middle.get('eventoId')?.setValue('middle');
    last.get('eventoId')?.setValue('last');

    component.removeHora(1);

    expect(component.horasFormArray.length).toBe(2);
    expect(component.horasFormArray.at(0)).toBe(first);
    expect(component.horasFormArray.at(1)).toBe(last);
    expect(component.horasFormArray.controls).not.toContain(middle);
    expect(component.horasFormArray.value.map((hora: any) => hora.eventoId)).toEqual([
      'first',
      'last',
    ]);
  });

  it('focuses the new interval event button after adding an interval', async () => {
    mobileSignal.set(true);
    fixture.detectChanges();
    (component as any).buildForm();
    fixture.detectChanges();

    component.addHora();
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(document.activeElement?.id).toBe('hora-evento-search-0');
  });

  it('returns focus to the event selector opener after selection or cancellation', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    const onClose = new Subject<any>();
    const selectorRef = { onClose } as any;
    const open = jasmine.createSpy('open').and.returnValue(selectorRef);
    (component as any).dialogService = { open };
    (component as any).buildForm();
    component.addHora();
    const hora = component.horasFormArray.at(0);

    component.modalSelEvento(hora, {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
      currentTarget: opener,
    } as any);
    expect(open).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ closeOnEscape: false }));
    onClose.next(null);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
