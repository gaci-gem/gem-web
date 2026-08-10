import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { HoraCrud } from './hora-crud';
import { EventoService } from '@core/services/evento';
import { RegistroHoraService } from '@core/services/registro-hora';
import { UserStorageService } from '@core/services/user-storage';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { ViewportService } from '@core/services/viewport.service';

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

    registroHoraServiceSpy = jasmine.createSpyObj<RegistroHoraService>('RegistroHoraService', ['getCategorias']);
    registroHoraServiceSpy.getCategorias.and.returnValue(of([]));
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

    registroHoraServiceSpy = jasmine.createSpyObj<RegistroHoraService>('RegistroHoraService', ['getCategorias']);
    registroHoraServiceSpy.getCategorias.and.returnValue(of([]));

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
        eventoIdPreseleccionado: 'evt-1',
      },
    };

    TestBed.resetTestingModule();
    eventoServiceSpy = jasmine.createSpyObj<EventoService>('EventoService', ['getAll']);
    eventoServiceSpy.getAll.and.returnValue(of([]));
    registroHoraServiceSpy = jasmine.createSpyObj<RegistroHoraService>('RegistroHoraService', ['getCategorias']);
    registroHoraServiceSpy.getCategorias.and.returnValue(of([]));

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

  it('should preserve the overlap validation between intervals', () => {
    (component as any).buildForm();
    component.addHora();
    component.addHora();
    component.horasFormArray.at(0).patchValue({ inicio: new Date(2026, 4, 27, 9, 0), fin: new Date(2026, 4, 27, 12, 0) });
    component.horasFormArray.at(1).patchValue({ inicio: new Date(2026, 4, 27, 11, 0), fin: new Date(2026, 4, 27, 13, 0) });
    component.horasFormArray.updateValueAndValidity();

    expect(component.horasFormArray.errors?.['overlap']).toBeTrue();
  });
});
