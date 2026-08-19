import { Observable, of, throwError } from 'rxjs';
import { CrudFormModal } from './crud-form-modal';

describe('CrudFormModal', () => {
  function createComponent(request: Observable<unknown>) {
    const component = Object.create(CrudFormModal.prototype) as any;
    component.form = { valid: true };
    component.modo = 'A';
    component.toModel = () => ({ name: 'value' });
    component.save = () => request;
    component.ref = { close: jasmine.createSpy('close') };
    component.showError = jasmine.createSpy('showError');
    component.showSuccess = jasmine.createSpy('showSuccess');
    component.successMessage = () => null;
    component.messageService = { add: jasmine.createSpy('add') };
    return component;
  }

  it('closes with the success envelope and resets submitting', () => {
    const component = createComponent(of({ id: 7 }));

    component.submit();

    expect(component.ref.close).toHaveBeenCalledWith({ changed: true, result: { id: 7 } });
    expect(component.submitting).toBeFalse();
  });

  it('keeps the modal open and shows the extracted request error', () => {
    const component = createComponent(throwError(() => ({ error: { message: ['Invalid value'] } })));

    component.submit();

    expect(component.ref.close).not.toHaveBeenCalled();
    expect(component.showError).toHaveBeenCalledWith('Error', 'Invalid value');
    expect(component.submitting).toBeFalse();
  });

  it('keeps the legacy close payload when save is not opted into', () => {
    const component = createComponent(of({ id: 7 }));
    component.save = () => null;

    component.submit();

    expect(component.ref.close).toHaveBeenCalledWith({ name: 'value' });
  });
});
