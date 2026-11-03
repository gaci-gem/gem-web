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

  it('gets ticket activity from the general endpoint', () => {
    service.actividad(7).subscribe();
    const request = http.expectOne(`${environment.apiBaseUrl}/tickets/7/actividad`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('notifies successful ticket mutations with the ticket id', () => {
    const updated: number[] = [];
    service.ticketUpdated$.subscribe(id => updated.push(id));
    service.transition(7, 'EN_REVISION').subscribe();
    const request = http.expectOne(`${environment.BASE_URL}/v1/gem-clientes/admin/clientes/tickets/7/estado`);
    request.flush({ id: 7 });
    expect(updated).toEqual([7]);
  });
});
