import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@/environments/environment';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { UsuarioService } from './usuario';

describe('UsuarioService.getAll', () => {
  let service: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [UsuarioService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializes filters and pagination for the main grid', () => {
    service.getAll(FiltroActivo.TRUE, { globalSearch: 'ana', rol: 'ADM', page: 2, limit: 5, sortField: 'apellido', sortDirection: 'desc' }).subscribe();
    const request = http.expectOne((req) => req.url === `${environment.BASE_URL}/usuario`);
    expect(request.request.params.get('globalSearch')).toBe('ana');
    expect(request.request.params.get('rol')).toBe('ADM');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('sortField')).toBe('apellido');
    expect(request.request.params.get('sortDirection')).toBe('desc');
    request.flush({ data: [], total: 11, page: 2, limit: 5, totalPages: 3 });
  });

  it('keeps the array contract without pagination parameters', () => {
    service.getAll(FiltroActivo.TRUE).subscribe();
    const request = http.expectOne((req) => req.url === `${environment.BASE_URL}/usuario`);
    expect(request.request.params.has('page')).toBeFalse();
    request.flush([]);
  });
});
