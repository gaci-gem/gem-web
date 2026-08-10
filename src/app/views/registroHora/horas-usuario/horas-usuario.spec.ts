import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { HorasUsuario } from './horas-usuario';
import { RegistroHora } from '@core/interfaces/registro-hora';
import { RegistroHoraService } from '@core/services/registro-hora';
import { UserStorageService } from '@core/services/user-storage';
import { LoadingService } from '@core/services/loading.service';
import { PermisosService } from '@core/services/permisos';
import { ViewportService } from '@core/services/viewport.service';

describe('HorasUsuario', () => {
  it('should reload the selected month from the mobile period control handler', () => {
    const registroHoraService = jasmine.createSpyObj<RegistroHoraService>(
      'RegistroHoraService',
      ['getCategorias', 'getByUsuario'],
    );
    registroHoraService.getCategorias.and.returnValue(of([]));
    registroHoraService.getByUsuario.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [HorasUsuario],
      providers: [
        { provide: RegistroHoraService, useValue: registroHoraService },
        { provide: UserStorageService, useValue: { getUsuario: () => ({ id: 'u-1' }) } },
        { provide: LoadingService, useValue: { show: jasmine.createSpy('show'), hide: jasmine.createSpy('hide') } },
        { provide: PermisosService, useValue: { can: () => true } },
        { provide: ViewportService, useValue: { isMobile: signal(true) } },
        DialogService,
        MessageService,
        ConfirmationService,
        provideZonelessChangeDetection(),
      ],
    });

    const fixture = TestBed.createComponent(HorasUsuario);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const selectedMonth = new Date(2026, 6, 1);

    component.onPeriodoMobileChange(selectedMonth);

    expect(component.dateFilter).toBe(selectedMonth);
    expect(registroHoraService.getByUsuario).toHaveBeenCalledWith('u-1', 7, 2026);
  });

  it('should expand only the selected mobile day card', () => {
    TestBed.configureTestingModule({
      imports: [HorasUsuario],
      providers: [
        { provide: RegistroHoraService, useValue: { getCategorias: () => of([]), getByUsuario: () => of([]) } },
        { provide: UserStorageService, useValue: { getUsuario: () => ({ id: 'u-1' }) } },
        { provide: LoadingService, useValue: { show: () => undefined, hide: () => undefined } },
        { provide: PermisosService, useValue: { can: () => true } },
        { provide: ViewportService, useValue: { isMobile: signal(true) } },
        DialogService,
        MessageService,
        ConfirmationService,
        provideZonelessChangeDetection(),
      ],
    });

    const component = TestBed.createComponent(HorasUsuario).componentInstance;
    const first = { id: 1, fecha: new Date('2026-07-01'), usuarioId: 'u-1' } as RegistroHora;
    const second = { id: 2, fecha: new Date('2026-07-02'), usuarioId: 'u-1' } as RegistroHora;

    component.toggleRegistro(first);

    expect(component.isRegistroExpandido(first)).toBeTrue();
    expect(component.isRegistroExpandido(second)).toBeFalse();
  });
});
