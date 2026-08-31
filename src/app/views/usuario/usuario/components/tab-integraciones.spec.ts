import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IntegrationTokenService } from '@core/services/integration-token';
import { TabIntegraciones } from './tab-integraciones';

describe('TabIntegraciones clipboard', () => {
  let component: TabIntegraciones;
  let fixture: ComponentFixture<TabIntegraciones>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TabIntegraciones],
      providers: [
        {
          provide: IntegrationTokenService,
          useValue: { list: () => of([]), create: () => of({}), revoke: () => of({}) },
        },
        { provide: ConfirmationService, useValue: {} },
        { provide: MessageService, useValue: { add: jasmine.createSpy('add') } },
      ],
    });

    fixture = TestBed.createComponent(TabIntegraciones);
    component = fixture.componentInstance;
    component.tokenActual = 'gem_secret_token';
  });

  it('copies with the Clipboard API when available', async () => {
    const writeText = spyOn(navigator.clipboard, 'writeText').and.resolveTo();

    await component.copiarToken();

    expect(writeText).toHaveBeenCalledWith('gem_secret_token');
    expect(component.copiaExitosa).toBeTrue();
    expect(component.copyError).toBeNull();
  });

  it('uses and cleans up the textarea fallback when the Clipboard API rejects', async () => {
    spyOn(navigator.clipboard, 'writeText').and.rejectWith(new DOMException('Not allowed', 'NotAllowedError'));
    const execCommand = spyOn(document, 'execCommand').and.returnValue(true);

    await component.copiarToken();

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(component.copiaExitosa).toBeTrue();
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('keeps the manual-copy message and logs diagnostics when both methods fail', async () => {
    spyOn(navigator.clipboard, 'writeText').and.rejectWith(new Error('Not allowed'));
    spyOn(document, 'execCommand').and.returnValue(false);
    const consoleError = spyOn(console, 'error');

    await component.copiarToken();

    expect(component.copiaExitosa).toBeFalse();
    expect(component.copyError).toBe('No se pudo copiar el token. Copialo manualmente.');
    expect(consoleError).toHaveBeenCalled();
    expect(JSON.stringify(consoleError.calls.mostRecent().args)).not.toContain('gem_secret_token');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('shows the complete plaintext token while it is available', () => {
    component.tokenPreview = 'gem_secret************ken';

    expect(component.tokenAcortado).toBe('gem_secret_token');
  });

  it('clears plaintext before loading a persisted token preview', () => {
    component.tokenActual = 'gem_secret_token';
    component.tokenPreview = 'gem_previous************iew';

    component.ngOnInit();

    expect(component.tokenActual).toBeNull();
    expect(component.tokenPreview).toBeNull();
    expect(component.tokenAcortado).toBe('');
  });
});
