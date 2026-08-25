import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '@/environments/environment';
import { IntegrationTokenService } from './integration-token';

describe('IntegrationTokenService', () => {
  let service: IntegrationTokenService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IntegrationTokenService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(IntegrationTokenService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates an integration token without a user id', () => {
    const request = { label: 'MCP', kind: 'mcp' };
    service.create(request).subscribe();

    const req = http.expectOne(
      `${environment.BASE_URL}/auth/integration-tokens`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({
      id: 'token-id',
      kind: 'mcp',
      label: 'MCP',
      expiresAt: null,
      tokenPreview: 'gem_ads5a****************Fg3',
      token: 'secret',
    });
  });

  it('lists integration token previews', () => {
    service.list().subscribe((response) => {
      expect(response[0].tokenPreview).toBe('gem_ads5a****************Fg3');
      expect(response[0].token).toBeUndefined();
    });

    const req = http.expectOne(
      `${environment.BASE_URL}/auth/integration-tokens`,
    );
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'token-id',
        kind: 'mcp',
        label: 'MCP',
        expiresAt: null,
        tokenPreview: 'gem_ads5a****************Fg3',
      },
    ]);
  });

  it('revokes an integration token', () => {
    service.revoke('token-id').subscribe();

    const req = http.expectOne(
      `${environment.BASE_URL}/auth/integration-tokens/token-id`,
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Integration token revoked successfully' });
  });
});
