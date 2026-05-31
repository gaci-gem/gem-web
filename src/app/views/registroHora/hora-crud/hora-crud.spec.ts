import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { HoraCrud } from './hora-crud';
import { EventoService } from '@core/services/evento';
import { RegistroHoraService } from '@core/services/registro-hora';
import { UserStorageService } from '@core/services/user-storage';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

describe('HoraCrud', () => {
  let component: HoraCrud;
  let fixture: ComponentFixture<HoraCrud>;
  let eventoServiceSpy: jasmine.SpyObj<EventoService>;
  let registroHoraServiceSpy: jasmine.SpyObj<RegistroHoraService>;

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

    await TestBed.configureTestingModule({
      imports: [HoraCrud],
      providers: [
        { provide: EventoService, useValue: eventoServiceSpy },
        { provide: DynamicDialogConfig, useValue: mockConfig },
        { provide: DynamicDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: DialogService, useValue: {} },
        { provide: RegistroHoraService, useValue: registroHoraServiceSpy },
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
});
