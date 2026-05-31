import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RegistroHoraService } from './registro-hora';
import { environment } from '@/environments/environment';

describe('RegistroHoraService', () => {
  let service: RegistroHoraService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RegistroHoraService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RegistroHoraService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getPorCategoria() should call the correct URL', () => {
    const eventoId = 'evt-123';
    service.getPorCategoria(eventoId).subscribe();

    const req = httpMock.expectOne(`${environment.BASE_URL}/registro-hora/evento/${eventoId}/por-categoria`);
    expect(req.request.method).toBe('GET');
    req.flush({ eventoId, categorias: [], totalGeneral: 0, totalGeneralFormateado: '0.00h' });
  });

  it('getAll() should include categoriaCodigo param when provided', () => {
    service.getAll(5, 2026, 'DEV').subscribe();

    const req = httpMock.expectOne(`${environment.BASE_URL}/registro-hora?mes=5&anio=2026&categoriaCodigo=DEV`);
    expect(req.request.method).toBe('GET');
    req.flush({ registros: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  });

  it('getAll() should not include categoriaCodigo param when not provided', () => {
    service.getAll(5, 2026).subscribe();

    const req = httpMock.expectOne(`${environment.BASE_URL}/registro-hora?mes=5&anio=2026`);
    expect(req.request.method).toBe('GET');
    expect(req.request.url).not.toContain('categoriaCodigo');
    req.flush({ registros: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  });
});
