import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { DrawerTicket } from './drawer-ticket';
import { TicketService } from '@core/services/ticket';
import { DrawerService } from '@core/services/drawer.service';
import { PermisosService } from '@core/services/permisos';
import { DialogService } from 'primeng/dynamicdialog';

describe('DrawerTicket', () => {
  let fixture: ComponentFixture<DrawerTicket>;
  const service = jasmine.createSpyObj<TicketService>('TicketService', ['detail', 'associateEvent', 'replaceEvents', 'comment', 'updateModule', 'emailOriginal']);
  const drawerService = jasmine.createSpyObj<DrawerService>('DrawerService', ['abrirEventoDrawer']);
  const permissions = jasmine.createSpyObj<PermisosService>('PermisosService', ['can']);
  const dialogService = jasmine.createSpyObj<DialogService>('DialogService', ['open']);

  beforeEach(async () => {
    service.associateEvent.calls.reset();
    service.replaceEvents.calls.reset();
    service.detail.calls.reset();
    dialogService.open.calls.reset();
    service.detail.and.returnValue(of({
      id: 7, subject: 'Subject', description: 'Description', status: 'INGRESADO',
       externalReference: 'EXT-7', clientName: 'Client', clientCode: 'CLI', clientId: 11,
       createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', comments: [], events: [{ id: 'event-7', type: 'TIP01', code: '7', title: 'Event', visibleState: 'OPEN', color: '#123456' }],
    }));
    service.associateEvent.and.returnValue(of({} as any));
    service.replaceEvents.and.returnValue(of({} as any));
    service.updateModule.and.returnValue(of({ module: null } as any));
    permissions.can.and.returnValue(true);
    await TestBed.configureTestingModule({
      imports: [DrawerTicket],
      providers: [
        { provide: TicketService, useValue: service },
        { provide: DrawerService, useValue: drawerService },
        { provide: PermisosService, useValue: permissions },
        { provide: DialogService, useValue: dialogService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DrawerTicket);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('ticketId', '7');
    fixture.detectChanges();
  });

  it('loads and renders ticket data with the management composer', () => {
    expect(service.detail).toHaveBeenCalledWith(7);
    expect(fixture.componentInstance.ticket?.subject).toBe('Subject');
    expect(fixture.componentInstance.ticket?.externalReference).toBe('EXT-7');
    expect(fixture.nativeElement.querySelector('textarea#ticket-comment')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ticket-related-events app-badge-click')?.textContent.trim()).toBe('TIP01-007');
  });

  it('loads and renders sanitized email HTML, plain fallback, and duplicate attachments', (done) => {
    service.emailOriginal.and.returnValue(of({ headers: { Subject: 'Mail' }, html: '<p>Body</p><img src="/v1/gem-clientes/admin/clientes/tickets/7/attachments/a/view"><a href="https://example.com/x">External</a><script>alert(1)</script>', text: 'Fallback', attachments: [
      { name: 'image.png', downloadUrl: '/v1/gem-clientes/admin/clientes/tickets/7/attachments/a/download' }, { name: 'image.png', downloadUrl: '/same' },
    ] }));
    fixture.componentInstance.openEmailOriginal({ id: 'original' });
    setTimeout(() => {
      fixture.detectChanges();
      expect(document.body.querySelector('.email-original-html')?.textContent).toContain('Body');
      expect(document.body.querySelectorAll('.email-original-html script').length).toBe(0);
      expect(document.body.querySelector('.email-original-html img')?.getAttribute('src'))
        .toBe(`${fixture.componentInstance.apiBaseUrl}/v1/gem-clientes/admin/clientes/tickets/7/attachments/a/view`);
      expect(document.body.querySelector('.email-original-html a')?.getAttribute('href')).toBe('https://example.com/x');
      expect(document.body.querySelectorAll(`a[href="${fixture.componentInstance.apiBaseUrl}/v1/gem-clientes/admin/clientes/tickets/7/attachments/a/download"]`).length).toBe(1);
      expect(fixture.componentInstance.emailOriginal?.attachments[1].downloadUrl).toBe('/same');
      expect(fixture.componentInstance.emailAttachmentKey({ name: 'image.png', downloadUrl: '/same' }, 0))
        .not.toBe(fixture.componentInstance.emailAttachmentKey({ name: 'image.png', downloadUrl: '/same' }, 1));
      done();
    }, 50);
  });

  it('generates direct GEM and GEM Clientes links', () => {
    expect(fixture.componentInstance.gemUrl).toBe(`${window.location.origin}/gem-clientes/tickets/7`);
    expect(fixture.componentInstance.gemClientesUrl).toBe('http://localhost:4201/tickets/7');
  });

  it('copies either destination and exposes transient feedback', async () => {
    const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await fixture.componentInstance.copyLink('clientes');
    expect(writeText).toHaveBeenCalledWith('http://localhost:4201/tickets/7');
    expect(fixture.componentInstance.copiedLink).toBe('clientes');
  });

  it('renders explicit GEM Web and GEM Clientes copy controls', () => {
    expect(fixture.nativeElement.querySelector('[aria-label="Copiar link de GEM Web"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Copiar link de GEM Clientes"]')).not.toBeNull();
  });

  it('renders description and comments with whitespace-safe readable classes', () => {
    fixture.componentInstance.ticket = {
      ...fixture.componentInstance.ticket!,
      description: 'First line\nSecond line',
      comments: [{ id: 1, text: 'Header: ' + 'x'.repeat(300), createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
    };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.ticket-readable-text').length).toBe(2);
  });

  it('opens the standard event drawer when a related event badge is clicked', () => {
    fixture.nativeElement.querySelector('app-badge-click').click();

    expect(drawerService.abrirEventoDrawer).toHaveBeenCalledWith('event-7');
  });

  it('selects a module and renders the returned module display', async () => {
    const module = { code: 'BILL', name: 'BILLER' };
    service.updateModule.and.returnValue(of({ module } as any));

    fixture.componentInstance.updateModule('BILL');
    await Promise.resolve();
    fixture.detectChanges();

    expect(service.updateModule).toHaveBeenCalledWith(7, 'BILL');
    expect(fixture.nativeElement.textContent).toContain('BILL - BILLER');
    expect(fixture.componentInstance.moduleSaving).toBeFalse();
    expect(fixture.nativeElement.querySelector('[aria-label="Limpiar módulo"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Seleccionar módulo"]')).toBeNull();
  });

  it('clears the optional module and renders a dash', async () => {
    fixture.componentInstance.ticket = { ...fixture.componentInstance.ticket!, module: { code: 'MOD-1', name: 'Module' } };
    service.updateModule.and.returnValue(of({ module: null } as any));
    fixture.componentInstance.clearModule(new Event('click'));
    await Promise.resolve();
    fixture.detectChanges();

    expect(service.updateModule).toHaveBeenCalledWith(7, null);
    expect(fixture.nativeElement.textContent).toContain('-');
    expect(fixture.componentInstance.moduleSaving).toBeFalse();
    expect(fixture.nativeElement.querySelector('[aria-label="Seleccionar módulo"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Limpiar módulo"]')).toBeNull();
  });

  it('shows only the search action when no module is assigned', () => {
    expect(fixture.nativeElement.querySelector('[aria-label="Seleccionar módulo"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Limpiar módulo"]')).toBeNull();
  });

  it('guards module controls while a save is in flight without disabled bindings', () => {
    let resolve!: (value: any) => void;
    service.updateModule.and.returnValue(new Observable(subscriber => {
      resolve = (value: any) => {
        subscriber.next(value);
        subscriber.complete();
      };
    }));
    fixture.componentInstance.updateModule('BILL');
    fixture.detectChanges();

    const control = fixture.nativeElement.querySelector('[aria-label="Seleccionar módulo"]');
    expect(control.getAttribute('disabled')).toBeNull();
    expect(control.getAttribute('aria-disabled')).toBe('true');
    expect(() => fixture.componentInstance.openModuleSelector(new Event('click'))).not.toThrow();

    resolve({ module: { code: 'BILL', name: 'BILLER' } });
  });

  it('sorts comments newest first without mutating the API array and limits the initial view', () => {
    const comments = Array.from({ length: 8 }, (_, index) => ({ id: index + 1, text: `Comment ${index + 1}`, createdAt: `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`, updatedAt: '' }));
    fixture.componentInstance.ticket = { ...fixture.componentInstance.ticket!, comments };
    fixture.detectChanges();
    expect(fixture.componentInstance.ticket?.comments).toEqual(comments);
    expect(fixture.componentInstance.displayedComments.map((comment) => comment.id)).toEqual([8, 7, 6, 5, 4, 3, 2]);
    expect(fixture.nativeElement.textContent).toContain('Ver comentarios anteriores');
  });

  it('offers the newest email original and hides EML attachments', () => {
    const comments: any[] = [
      { id: 1, text: 'Older reply', source: 'EMAIL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '', attachments: [{ id: 'old', name: 'old.eml', mimeType: 'message/rfc822', downloadUrl: '/old' }] },
      { id: 2, text: 'Latest reply', source: 'EMAIL', createdAt: '2026-01-02T00:00:00Z', updatedAt: '', attachments: [{ id: 'latest', name: 'latest.eml', mimeType: 'message/rfc822', downloadUrl: '/latest' }] },
    ];
    fixture.componentInstance.ticket = { ...fixture.componentInstance.ticket!, comments, attachments: [
      { id: 'eml', name: 'ticket.eml', mimeType: 'message/rfc822', downloadUrl: '/eml', createdAt: '', size: 1, checksum: '' },
      { id: 'pdf', name: 'ticket.pdf', mimeType: 'application/pdf', downloadUrl: '/pdf', createdAt: '', size: 1, checksum: '' },
    ] };
    fixture.detectChanges();

    expect(fixture.componentInstance.latestEmailOriginal?.id).toBe('latest');
    expect(fixture.nativeElement.querySelector('[aria-label="Ver último correo original"] ng-icon')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Latest reply');
    expect(fixture.nativeElement.textContent).not.toContain('Ver correo original');
    expect(fixture.nativeElement.querySelector('a[href$="/eml"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href$="/pdf"]')).not.toBeNull();
  });

  it('hides the latest-email action when no email has an original EML', () => {
    fixture.componentInstance.ticket = { ...fixture.componentInstance.ticket!, comments: [{ id: 1, text: 'Reply', source: 'EMAIL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '', attachments: [] }] as any };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Ver último correo original"]')).toBeNull();
  });

  it('posts a comment, prepends the response, and clears the draft', () => {
    const comment = { id: 9, text: 'New comment', createdAt: '2026-02-01T00:00:00Z', updatedAt: '' };
    service.comment.and.returnValue(of(comment));
    fixture.componentInstance.commentDraft = ' New comment ';
    fixture.componentInstance.submitComment();
    expect(service.comment).toHaveBeenCalledWith(7, 'New comment', 'PUBLIC');
    expect(fixture.componentInstance.commentDraft).toBe('');
    expect(fixture.componentInstance.ticket?.comments[0]).toEqual(comment);
  });

  it('associates a client event and updates the ticket events immediately', () => {
    const event = {
      id: 'event-8', tipoCodigo: 'TIP02', numero: 8, titulo: 'Existing event', cerrado: false,
      clienteId: 11, tipo: { color: '#654321' },
    } as any;
    dialogService.open.and.returnValue({ onClose: of(event) } as any);
    fixture.componentInstance.openEventAssociation();

    expect(service.associateEvent).toHaveBeenCalledWith(7, 'event-8');
    expect(fixture.componentInstance.ticket?.events.map((item) => item.id)).toEqual(['event-7', 'event-8']);
    expect(dialogService.open).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({
      data: { multiple: true, clienteId: 11, excludedEventIds: ['event-7'], initialSelectedEventIds: ['event-7'] },
    }));
  });

  it('replaces all selected ticket events, including removals', (done) => {
    const events = [
      { id: 'event-9', tipoCodigo: 'TIP03', numero: 9, titulo: 'New event' },
    ] as any;
    dialogService.open.and.returnValue({ onClose: of(events) } as any);

    fixture.componentInstance.openEventAssociation();
    setTimeout(() => {
      expect(service.replaceEvents).toHaveBeenCalledWith(7, ['event-9']);
      expect(service.associateEvent).not.toHaveBeenCalled();
      expect(service.detail).toHaveBeenCalledTimes(2);
      done();
    });
  });

  it('keeps the single-event dialog result compatible', () => {
    const event = { id: 'event-8', tipoCodigo: 'TIP02', numero: 8, titulo: 'Existing event', cerrado: false } as any;
    dialogService.open.and.returnValue({ onClose: of(event) } as any);

    fixture.componentInstance.openEventAssociation();

    expect(service.associateEvent).toHaveBeenCalledWith(7, 'event-8');
  });
});
