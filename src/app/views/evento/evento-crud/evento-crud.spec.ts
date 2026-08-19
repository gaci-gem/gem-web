import { of, throwError } from 'rxjs';
import { EventoCrud } from './evento-crud';

describe('EventoCrud', () => {
  it('keeps the modal open and displays the error when external submit fails', () => {
    const ref = { close: jasmine.createSpy('close') };
    const showError = jasmine.createSpy('showError');
    const request = throwError(() => ({ status: 500, error: { message: 'Server error' } }));
    const component = Object.create(EventoCrud.prototype) as any;
    component.form = { valid: true, controls: {}, get: () => ({ value: null }) };
    component.config = { data: { submitExternally: () => request } };
    component.ref = ref;
    component.cdr = { detectChanges: jasmine.createSpy('detectChanges') };
    component.toModel = () => new FormData();
    component.showError = showError;
    component.getRequestError = (error: any) => error.error.message;
    component.getCamposFaltantes = () => [];

    component.accion({ preventDefault: jasmine.createSpy('preventDefault') } as any);

    expect(ref.close).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith('Error', 'Server error');
  });

  it('sends only the event payload and closes with the wrapper after external submit succeeds', () => {
    const ref = { close: jasmine.createSpy('close') };
    const submitExternally = jasmine.createSpy('submitExternally').and.returnValue(of({ id: 'event-1' }));
    const payload = new FormData();
    payload.append('titulo', 'Ticket event');
    const component = Object.create(EventoCrud.prototype) as any;
    component.form = { valid: true, controls: {}, get: () => ({ value: null }) };
    component.config = { data: { submitExternally } };
    component.ref = ref;
    component.cdr = { detectChanges: jasmine.createSpy('detectChanges') };
    component.toModel = () => payload;
    component.showSuccess = jasmine.createSpy('showSuccess');
    component.getCamposFaltantes = () => [];

    component.accion({ preventDefault: jasmine.createSpy('preventDefault') } as any);

    expect(submitExternally).toHaveBeenCalledWith(payload);
    const requestBody = submitExternally.calls.mostRecent().args[0] as FormData;
    expect(requestBody.get('changed')).toBeNull();
    expect(requestBody.get('result')).toBeNull();
    expect(ref.close).toHaveBeenCalledWith({ changed: true, result: { id: 'event-1' } });
  });

  it('does not include numero in ticket-scoped external multipart payloads', () => {
    const component = Object.create(EventoCrud.prototype) as any;
    const values: Record<string, unknown> = {
      id: '', numero: 0, tipoEvento: { codigo: 'TIP01', propio: false },
      prioridadUsu: 1, titulo: 'Ticket event', cliente: { id: 42 }, proyecto: { id: 4 },
      producto: { id: 9 }, modulo: { codigo: 'MOD01' }, comentario: '', facEventoCerr: false,
      cerrado: false, etapaActual: 1, usuarioAltaId: 'operator-1', estimacion: 0,
    };
    component.config = { data: { submitExternally: jasmine.createSpy('submitExternally') } };
    component.get = (name: string) => ({ value: values[name] });
    component.uploadedFiles = [];

    const formData = component.toModel() as FormData;

    expect(formData.has('numero')).toBeFalse();
    expect(formData.has('estimacion')).toBeFalse();
    expect(formData.get('proyectoId')).toBe('4');
  });

  it('includes a positive estimacion in ticket-scoped external multipart payloads', () => {
    const component = Object.create(EventoCrud.prototype) as any;
    const values: Record<string, unknown> = {
      tipoEvento: { codigo: 'TIP01', propio: false }, prioridadUsu: 1, titulo: 'Ticket event',
      cliente: { id: 42 }, proyecto: { id: 4 }, producto: { id: 9 }, modulo: { codigo: 'MOD01' },
      comentario: '', facEventoCerr: false, cerrado: false, etapaActual: 1,
      usuarioAltaId: 'operator-1', estimacion: 2.5,
    };
    component.config = { data: { submitExternally: jasmine.createSpy('submitExternally') } };
    component.get = (name: string) => ({ value: values[name] });
    component.uploadedFiles = [];

    const formData = component.toModel() as FormData;

    expect(formData.get('estimacion')).toBe('2.5');
  });
});
