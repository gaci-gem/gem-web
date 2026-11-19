import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { AppVersion, hasPublishedVersionChanged, VersionService } from './version'

const version = (overrides: Partial<AppVersion> = {}): AppVersion => ({
  version: '1.0.0',
  branch: 'main',
  commitHash: 'abc123',
  buildTime: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('VersionService', () => {
  let service: VersionService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VersionService, provideHttpClient(), provideHttpClientTesting()],
    })
    service = TestBed.inject(VersionService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('detecta cambios por commitHash', () => {
    expect(hasPublishedVersionChanged(version(), version({ commitHash: 'def456' }))).toBeTrue()
    expect(hasPublishedVersionChanged(version(), version())).toBeFalse()
  })

  it('usa version y buildTime como fallback', () => {
    expect(hasPublishedVersionChanged(version({ commitHash: '' }), version({ commitHash: '', version: '1.0.1' }))).toBeTrue()
    expect(hasPublishedVersionChanged(version({ commitHash: '' }), version({ commitHash: '', buildTime: '2026-01-02T00:00:00.000Z' }))).toBeTrue()
  })

  it('refresca version.json con cache-busting y reemplaza el valor cacheado', () => {
    service.refreshVersion().subscribe()
    const request = http.expectOne(request => request.url.startsWith('assets/version.json'))
    expect(request.request.urlWithParams).toContain('nocache=')
    request.flush(version({ commitHash: 'new-build' }))

    service.getVersion().subscribe(result => expect(result.commitHash).toBe('new-build'))
  })
})
