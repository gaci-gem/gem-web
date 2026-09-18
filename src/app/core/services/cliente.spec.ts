import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@/environments/environment';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { ClienteService } from './cliente';

describe('ClienteService.getAll', () => {
  let service: ClienteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ClienteService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ClienteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializes visible filters and pagination for the main grid', () => {
    service.getAll(FiltroActivo.FALSE, { globalSearch: 'acme', sigla: 'AC', page: 2, limit: 5, sortField: 'nombre', sortDirection: 'asc' }).subscribe();
    const request = http.expectOne((req) => req.url === `${environment.BASE_URL}/cliente`);
    expect(request.request.params.get('globalSearch')).toBe('acme');
    expect(request.request.params.get('sigla')).toBe('AC');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('sortField')).toBe('nombre');
    expect(request.request.params.get('sortDirection')).toBe('asc');
    request.flush({ data: [], total: 6, page: 2, limit: 5, totalPages: 2 });
  });

  it('keeps the array contract without pagination parameters', () => {
    service.getAll(FiltroActivo.TRUE).subscribe();
    const request = http.expectOne((req) => req.url === `${environment.BASE_URL}/cliente`);
    expect(request.request.params.has('page')).toBeFalse();
    request.flush([]);
  });
});
