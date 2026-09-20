import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@/environments/environment';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { EventoService } from './evento';

describe('EventoService.getAllComplete', () => {
  let service: EventoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EventoService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EventoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends filters and pagination parameters for the main grid', () => {
    service.getAllComplete(FiltroActivo.FALSE, {
      desde: '01/09/2026', hasta: '30/09/2026', page: 3, limit: 5,
    }).subscribe();

    const request = http.expectOne((req) => req.url === `${environment.BASE_URL}/evento/completo`);
    expect(request.request.params.get('page')).toBe('3');
    expect(request.request.params.get('limit')).toBe('5');
    request.flush({ data: [], total: 11, page: 3, limit: 5, totalPages: 3 });
  });

  it('forwards the validated sort contract for both complete-list endpoints', () => {
    service.getAllComplete(FiltroActivo.FALSE, {
      page: 2, limit: 5, sortField: 'fechaFinEst', sortDirection: 'asc',
    }).subscribe();
    let request = http.expectOne((req) => req.url === `${environment.BASE_URL}/evento/completo`);
    expect(request.request.params.get('sortField')).toBe('fechaFinEst');
    expect(request.request.params.get('sortDirection')).toBe('asc');
    request.flush({ data: [], total: 0, page: 2, limit: 5, totalPages: 0 });

    service.getAllCompleteByUsuario('user-1', {
      page: 3, limit: 5, sortField: 'prioridadFin', sortDirection: 'desc',
    }).subscribe();
    request = http.expectOne((req) => req.url === `${environment.BASE_URL}/evento/completo/usuario/user-1`);
    expect(request.request.params.get('sortField')).toBe('prioridadFin');
    expect(request.request.params.get('sortDirection')).toBe('desc');
    expect(request.request.params.get('page')).toBe('3');
    request.flush({ data: [], total: 0, page: 3, limit: 5, totalPages: 0 });
  });

  it('serializes global and visible column filters', () => {
    service.getAllComplete(FiltroActivo.FALSE, {
      globalSearch: 'acme', eventoSearch: 'EVT-001', titulo: 'Incident',
      etapa: 'Analysis', cliente: 'Acme', producto: 'Portal', modulo: 'Auth', usuario: 'jdoe',
      page: 1, limit: 10,
    }).subscribe();

    const request = http.expectOne((req) => req.url === `${environment.BASE_URL}/evento/completo`);
    expect(request.request.params.get('globalSearch')).toBe('acme');
    expect(request.request.params.get('eventoSearch')).toBe('EVT-001');
    expect(request.request.params.get('usuario')).toBe('jdoe');
    request.flush({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  });

  it('keeps the array contract when pagination is omitted', () => {
    service.getAllComplete(FiltroActivo.FALSE).subscribe();
    const request = http.expectOne((req) => req.url === `${environment.BASE_URL}/evento/completo`);
    request.flush([]);
    expect(request.request.params.has('page')).toBeFalse();
  });

  it('sends pagination and translated filters for user events', () => {
    service.getAllCompleteByUsuario('user-1', {
      globalSearch: 'acme', cliente: 'Acme', page: 2, limit: 5,
    }).subscribe();

    const request = http.expectOne((req) => req.url === `${environment.BASE_URL}/evento/completo/usuario/user-1`);
    expect(request.request.params.get('cerrado')).toBe(FiltroActivo.FALSE);
    expect(request.request.params.get('globalSearch')).toBe('acme');
    expect(request.request.params.get('cliente')).toBe('Acme');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('5');
    request.flush({ data: [], total: 6, page: 2, limit: 5, totalPages: 2 });
  });

  it('keeps the legacy user-event array contract when pagination is omitted', () => {
    service.getAllCompleteByUsuario('user-1').subscribe();
    const request = http.expectOne((req) => req.url === `${environment.BASE_URL}/evento/completo/usuario/user-1`);
    expect(request.request.params.has('page')).toBeFalse();
    request.flush([]);
  });
});
