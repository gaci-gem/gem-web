import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@/environments/environment';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { ProductoService } from './producto';
import { ProyectoService } from './proyecto';
import { ParametroService } from './parametros';
import { TipoEventoService } from './tipo-evento';
import { Productos } from '../../views/producto/productos/productos';
import { Proyectos } from '../../views/proyecto/proyectos/proyectos';
import { Parametros } from '../../views/parametro/parametros/parametros';
import { TiposEvento } from '../../views/tipo-evento/tipos-evento/tipos-evento';
import { KbService } from './kb';
import { ReporteService } from './reporte';
import { Kbs } from '../../views/kb/kbs/kbs';
import { Reportes } from '../../views/reporte/reportes/reportes';

describe('main grid list services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializes filters, sort, and pagination while retaining legacy arrays', () => {
    const requests: [any, string, any][] = [
      [TestBed.inject(ProductoService), '/producto', { nombre: 'Product' }],
      [TestBed.inject(ProyectoService), '/proyecto', { clienteId: 3 }],
      [TestBed.inject(ParametroService), '/parametros', { clave: 'KEY' }],
      [TestBed.inject(TipoEventoService), '/tipo-evento', { codigo: 'EV' }],
    ];
    requests.forEach(([service, path, filter]) => {
      const args = service === TestBed.inject(ParametroService) || service === TestBed.inject(TipoEventoService)
        ? { ...filter, globalSearch: 'term', page: 2, limit: 5, sortField: service === TestBed.inject(ParametroService) ? 'clave' : 'codigo', sortDirection: 'desc' }
        : { ...filter, globalSearch: 'term', page: 2, limit: 5, sortField: 'nombre', sortDirection: 'desc' };
      const request$ = service instanceof ParametroService || service instanceof TipoEventoService
        ? (service as any).getAll(args)
        : (service as any).getAll(FiltroActivo.FALSE, args);
      request$.subscribe();
      const request = http.expectOne((req) => req.url === `${environment.BASE_URL}${path}`);
      expect(request.request.params.get('page')).toBe('2');
      expect(request.request.params.get('limit')).toBe('5');
      expect(request.request.params.get('globalSearch')).toBe('term');
      request.flush({ data: [], total: 0, page: 2, limit: 5, totalPages: 0 });
    });
  });

  it('resets the paginator before reloading after a filter or sort change', () => {
    [Productos, Proyectos, Parametros, TiposEvento, Kbs, Reportes].forEach((componentType) => {
      const resetPaginator = jasmine.createSpy('resetPaginator');
      const loadItems = jasmine.createSpy('loadItems');
      const component = { resetPaginator, loadItems } as any;
      componentType.prototype.onGlobalFilter.call(component, 'term');
      expect(resetPaginator).toHaveBeenCalledBefore(loadItems);
      resetPaginator.calls.reset();
      loadItems.calls.reset();
      componentType.prototype.onTableSort.call(component, { sortField: 'nombre', sortOrder: 1 });
      expect(resetPaginator).toHaveBeenCalledBefore(loadItems);
    });
  });

  it('serializes KB catalog filters and report user-scoped grid pagination', () => {
    const kbService = TestBed.inject(KbService);
    kbService.findAll({ search: 'term', page: 2, limit: 5, catalogos: { plataforma: ['GENEXUS'] } }).subscribe();
    const kbRequest = http.expectOne((req) => req.url.endsWith('/kb'));
    expect(kbRequest.request.params.get('search')).toBe('term');
    expect(kbRequest.request.params.get('plataforma')).toBe('GENEXUS');
    kbRequest.flush({ data: [], total: 0, page: 2, limit: 5, totalPages: 0 });

    const reporteService = TestBed.inject(ReporteService);
    reporteService.getAll('true', { globalSearch: 'term', page: 2, limit: 5, estado: 'ER' }).subscribe();
    const reportRequest = http.expectOne((req) => req.url.endsWith('/reporte'));
    expect(reportRequest.request.params.get('page')).toBe('2');
    expect(reportRequest.request.params.get('estado')).toBe('ER');
    expect(reportRequest.request.params.get('activo')).toBeNull();
    reportRequest.flush({ data: [], total: 0, page: 2, limit: 5, totalPages: 0 });
  });
});
