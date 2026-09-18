import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@/environments/environment';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { EntornoService } from './entorno';
import { EtapaService } from './etapa';
import { ModuloService } from './modulo';
import { RolService } from './rol';

describe('catalog list services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializes pagination, filters, and sorting for each main grid', () => {
    const requests = [
      [TestBed.inject(EntornoService), '/entorno', { codigo: 'DEV' }],
      [TestBed.inject(EtapaService), '/etapa', { nombre: 'Inicio' }],
      [TestBed.inject(ModuloService), '/modulo', { padreCodigo: 'SYS' }],
      [TestBed.inject(RolService), '/rol', { descripcion: 'Admin' }],
    ] as const;

    requests.forEach(([service, path, filter]) => {
      (service as any).getAll(FiltroActivo.FALSE, {
        ...filter, globalSearch: 'term', page: 2, limit: 5, sortField: 'codigo', sortDirection: 'desc',
      }).subscribe();
      const request = http.expectOne((req) => req.url === `${environment.BASE_URL}${path}`);
      expect(request.request.params.get('globalSearch')).toBe('term');
      expect(request.request.params.get('page')).toBe('2');
      expect(request.request.params.get('limit')).toBe('5');
      expect(request.request.params.get('sortDirection')).toBe('desc');
      request.flush({ data: [], total: 0, page: 2, limit: 5, totalPages: 0 });
    });
  });

  it('keeps legacy array requests without pagination parameters', () => {
    [EntornoService, EtapaService, ModuloService, RolService].forEach((serviceType) => {
      (TestBed.inject(serviceType as any) as any).getAll(FiltroActivo.TRUE).subscribe();
      const request = http.expectOne((req) => req.url.endsWith(`/${serviceType.name.replace('Service', '').toLowerCase()}`));
      expect(request.request.params.has('page')).toBeFalse();
      request.flush([]);
    });
  });
});
