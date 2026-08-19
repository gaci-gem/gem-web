import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TicketService } from '@core/services/ticket';
import { TicketActionDialog } from './ticket-action-dialog';

describe('TicketActionDialog', () => {
  let service: jasmine.SpyObj<TicketService>;
  let ref: jasmine.SpyObj<DynamicDialogRef>;

  beforeEach(() => {
    service = jasmine.createSpyObj<TicketService>('TicketService', ['transition', 'updateExternalReference', 'comment']);
    ref = jasmine.createSpyObj<DynamicDialogRef>('DynamicDialogRef', ['close']);
  });

  function create(mode: 'state' | 'reference' | 'comment'): TicketActionDialog {
    TestBed.configureTestingModule({
      imports: [TicketActionDialog],
      providers: [
        { provide: TicketService, useValue: service },
        { provide: DynamicDialogRef, useValue: ref },
        { provide: DynamicDialogConfig, useValue: { data: { mode, ticketId: 7, transitions: ['EN_PROCESO'], reference: 'EXT-7' } } },
      ],
    });
    return TestBed.runInInjectionContext(() => new TicketActionDialog());
  }

  it('closes once with changed payload after changing state', () => {
    service.transition.and.returnValue(of({} as any));
    const component = create('state');
    component.state = 'EN_REVISION';

    component.submit();
    component.submit();

    expect(ref.close).toHaveBeenCalledOnceWith({ changed: true });
  });

  it('closes once with changed payload after updating the external reference', () => {
    service.updateExternalReference.and.returnValue(of({} as any));
    const component = create('reference');

    component.submit();

    expect(ref.close).toHaveBeenCalledOnceWith({ changed: true });
  });

  it('closes once with changed payload after replying to the ticket', () => {
    service.comment.and.returnValue(of({} as any));
    const component = create('comment');
    component.comment = 'Reply';

    component.submit();

    expect(ref.close).toHaveBeenCalledOnceWith({ changed: true });
  });

  it('keeps the dialog open on error and allows cancellation', () => {
    service.comment.and.returnValue(throwError(() => new Error('failure')));
    const component = create('comment');
    component.comment = 'Reply';

    component.submit();
    expect(component.saving).toBeFalse();
    expect(ref.close).not.toHaveBeenCalled();

    component.cancel();
    expect(ref.close).toHaveBeenCalledOnceWith(undefined);
  });

  it('closes without a result when the close button is activated', () => {
    const component = create('comment');

    component.closeWithoutChanges();

    expect(ref.close).toHaveBeenCalledOnceWith(undefined);
    expect(service.comment).not.toHaveBeenCalled();
  });
});
