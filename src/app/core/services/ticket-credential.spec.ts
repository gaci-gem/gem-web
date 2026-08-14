import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TicketCredentialService } from './ticket-credential';

describe('TicketCredentialService', () => {
  let service: TicketCredentialService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TicketCredentialService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TicketCredentialService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a credential with only the login', () => {
    service.create(42, { login: 'cliente@example.com' }).subscribe();

    const request = http.expectOne('/v1/portal-cliente/admin/clientes/42/credenciales');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ login: 'cliente@example.com' });
    request.flush(null);
  });

  it('lists credentials for a client', () => {
    service.list(42).subscribe();

    const request = http.expectOne('/v1/portal-cliente/admin/clientes/42/credenciales');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('updates a credential with a partial payload', () => {
    service.update(42, 'credential-1', { activo: true }).subscribe();

    const request = http.expectOne('/v1/portal-cliente/admin/clientes/42/credenciales/credential-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ activo: true });
    request.flush(null);
  });

  it('deactivates a credential', () => {
    service.deactivate(42, 'credential-1').subscribe();

    const request = http.expectOne('/v1/portal-cliente/admin/clientes/42/credenciales/credential-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('rotates a credential by id', () => {
    service.rotate(42, 'credential-1').subscribe();

    const request = http.expectOne('/v1/portal-cliente/admin/clientes/42/credenciales/credential-1/rotate');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush(null);
  });
});
