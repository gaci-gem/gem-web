// credentials-interceptor.spec.ts
// Slice 3 (shared-auth-cross-origin): credentials-interceptor assertions.
//
// The interceptor clones requests targeting `environment.apiBaseUrl` with
// `withCredentials: true` so the browser attaches the auth cookie on
// cross-origin HTTP calls to gem-api. Same-origin / unrelated requests pass
// through untouched.
//
// Spec contracts:
// 1. When `environment.apiBaseUrl` is configured AND the request URL starts
//    with it, the request is cloned with `withCredentials: true`.
// 2. When the URL is NOT a prefix match (or apiBaseUrl is empty), the request
//    is forwarded untouched — `withCredentials` remains undefined.
// 3. The body / method / headers are preserved on the cloned request.

import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment as envModule } from '@/environments/environment';
import { credentialsInterceptor } from '@core/interceptors/credentials-interceptor';

describe('credentialsInterceptor (REQ-cross-app-cors — Slice 3 wire)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    // Karma runs against the base `environment.ts` (apiBaseUrl=''). The
    // tests below mutate envModule to exercise both branches of the
    // predicate — restore the base empty string afterwards so other specs
    // are not affected by side-effects.
    envModule.apiBaseUrl = '';
  });

  function withApiBase(value: string) {
    envModule.apiBaseUrl = value;
  }

  it('clones requests to apiBaseUrl with withCredentials=true', () => {
    withApiBase('https://makima-v2.julitorossian.dev');
    const target = `${envModule.apiBaseUrl}/auth/profile`;

    http.get(target).subscribe();

    const req = httpMock.expectOne(target);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({});
  });

  it('leaves requests with credentials flag undefined when URL is not under apiBaseUrl', () => {
    withApiBase('https://makima-v2.julitorossian.dev');
    const foreign = 'https://cdn.example.com/assets/logo.png';

    http.get(foreign).subscribe();

    const req = httpMock.expectOne(foreign);
    expect(req.request.withCredentials).toBeFalsy();
    req.flush({});
  });

  it('passes through as a no-op when apiBaseUrl is empty (default env)', () => {
    // apiBaseUrl = '' from the base environment.ts — the interceptor MUST NOT
    // clone every same-origin relative request just because every string has
    // an empty-string prefix.
    withApiBase('');
    const target = '/auth/profile';

    http.get(target).subscribe();

    const req = httpMock.expectOne(target);
    expect(req.request.withCredentials).toBeFalsy();
    req.flush({});
  });

  it('does not modify body / method / headers on the cloned request', () => {
    withApiBase('https://makima-v2.julitorossian.dev');
    const target = `${envModule.apiBaseUrl}/auth/logout`;

    http.post(target, { reason: 'user' }).subscribe();

    const req = httpMock.expectOne(target);
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({ reason: 'user' });
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
