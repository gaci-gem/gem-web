import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@/environments/environment';
import { TicketService } from './ticket';

describe('TicketService', () => {
  let service: TicketService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TicketService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TicketService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends filters and server pagination parameters to the admin endpoint', () => {
    service.list({ search: 'access', estado: 'EN_REVISION', page: 2, limit: 5 }).subscribe();
    const request = http.expectOne((req) => req.url === `${environment.BASE_URL}/v1/gem-clientes/admin/clientes/tickets`);

    expect(request.request.params.get('search')).toBe('access');
    expect(request.request.params.get('estado')).toBe('EN_REVISION');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('5');
    request.flush({ data: [], total: 10, page: 2, limit: 5, totalPages: 2 });
  });
});
