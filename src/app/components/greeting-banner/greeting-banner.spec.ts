import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { GreetingBannerComponent } from './greeting-banner'
import { UserStorageService } from '@core/services/user-storage'
import { SaludoConfig } from './greeting-banner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildConfig(overrides: Partial<SaludoConfig> = {}): SaludoConfig {
  return {
    prioridad: ['cumpleanios', 'postAusencia', 'horario'],
    cumpleanios: ['¡Feliz cumpleaños, {nombre}! 🎂', '¡Hoy es tu día, {nombre}! 🎉'],
    horario: {
      manana: ['¡Buenos días, {nombre}!', '¡Muy buenos días, {nombre}! 🌤️'],
      tarde: ['¡Buenas tardes, {nombre}!', '¡Hermosa tarde, {nombre}! 🌅'],
      noche: ['¡Buenas noches, {nombre}!', '¡Hermosa noche, {nombre}! 🌙']
    },
    postAusencia: [
      { minDias: 8, mensajes: ['¡Hacía tiempo, {nombre}! 🙌', '¡Qué bueno verte de nuevo, {nombre}!'] },
      { minDias: 14, mensajes: ['¡Ya son dos semanas, {nombre}!', 'Dos semanas sin verte, {nombre}! 💪'] },
      { minDias: 30, mensajes: ['¡Un mes sin noticias, {nombre}!', '¡Treinta días, {nombre}! Te extrañamos 🔥'] }
    ],
    ...overrides
  }
}

// ---------------------------------------------------------------------------
// Priority evaluation
// ---------------------------------------------------------------------------

describe('GreetingBannerComponent – priority evaluation', () => {
  let component: GreetingBannerComponent

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GreetingBannerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    const fixture = TestBed.createComponent(GreetingBannerComponent)
    component = fixture.componentInstance
  })

  it('birthday wins over post-absence and horario when cumpleanios is first', () => {
    const config = buildConfig()
    const resultado = component.evaluarPrioridad(config, {
      id: '1', nombre: 'Test', apellido: 'User', email: 'test@test.com',
      esCumpleanios: true, diasAusente: 45
    })
    expect(resultado).toContain('{nombre}')
    expect(resultado).toMatch(/cumpleaños|día|complas/)
  })

  it('post-absence wins when birthday is false and postAusencia is second', () => {
    const config = buildConfig()
    const resultado = component.evaluarPrioridad(config, {
      id: '1', nombre: 'Test', apellido: 'User', email: 'test@test.com',
      esCumpleanios: false, diasAusente: 45
    })
    expect(resultado).toContain('{nombre}')
    expect(resultado).toMatch(/tiempo|semana|mes|días|extrañamos/)
  })

  it('respects custom priority order from JSON', () => {
    const config = buildConfig({
      prioridad: ['postAusencia', 'horario', 'cumpleanios']
    })
    // User has birthday AND is absent — postAusencia is first, so it wins
    const resultado = component.evaluarPrioridad(config, {
      id: '1', nombre: 'Test', apellido: 'User', email: 'test@test.com',
      esCumpleanios: true, diasAusente: 45
    })
    expect(resultado).toMatch(/tiempo|semana|mes|días|extrañamos/)
    expect(resultado).not.toMatch(/\bcumpleaños\b|\bdía\b|complas/)
  })

  it('falls back to default prioridad when config has empty priority array', () => {
    const config = buildConfig({ prioridad: [] })
    const resultado = component.evaluarPrioridad(config, {
      id: '1', nombre: 'Test', apellido: 'User', email: 'test@test.com',
      esCumpleanios: true, diasAusente: 0
    })
    // Default order: cumpleanios first, so birthday wins
    expect(resultado).toMatch(/cumpleaños|día|complas/)
  })

  it('fallback to default prioridad when prioridad is missing', () => {
    const config = buildConfig({ prioridad: undefined as any })
    const resultado = component.evaluarPrioridad(config, {
      id: '1', nombre: 'Test', apellido: 'User', email: 'test@test.com',
      esCumpleanios: true, diasAusente: 0
    })
    expect(resultado).toMatch(/cumpleaños|día|complas/)
  })

  it('returns empty string when no type matches (no birthday, no absence, horario missing)', () => {
    const config = buildConfig({
      horario: { manada: [] } as any,
      cumpleanios: [],
      postAusencia: []
    })
    // Override: cumpleanios has no messages, postAusencia empty, horario missing tarde/noche/manada
    const resultado = component.evaluarPrioridad(config, {
      id: '1', nombre: 'Test', apellido: 'User', email: 'test@test.com',
      esCumpleanios: false, diasAusente: 0
    })
    // horario with missing period still returns fallback
    expect(resultado).toBe('¡Bienvenido, {nombre}!')
  })
})

// ---------------------------------------------------------------------------
// Time-of-day boundaries
// ---------------------------------------------------------------------------

describe('GreetingBannerComponent – getTimePeriod', () => {
  let component: GreetingBannerComponent

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GreetingBannerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    const fixture = TestBed.createComponent(GreetingBannerComponent)
    component = fixture.componentInstance
  })

  it('05:59 → noche', () => expect(component.getTimePeriod(5)).toBe('noche'))
  it('06:00 → manana', () => expect(component.getTimePeriod(6)).toBe('manana'))
  it('11:59 → manana', () => expect(component.getTimePeriod(11)).toBe('manana'))
  it('12:00 → tarde', () => expect(component.getTimePeriod(12)).toBe('tarde'))
  it('18:59 → tarde', () => expect(component.getTimePeriod(18)).toBe('tarde'))
  it('19:00 → noche', () => expect(component.getTimePeriod(19)).toBe('noche'))
  it('03:00 → noche', () => expect(component.getTimePeriod(3)).toBe('noche'))
  it('00:00 → noche', () => expect(component.getTimePeriod(0)).toBe('noche'))
  it('23:59 → noche', () => expect(component.getTimePeriod(23)).toBe('noche'))
})

// ---------------------------------------------------------------------------
// Post-absence threshold matching
// ---------------------------------------------------------------------------

describe('GreetingBannerComponent – findThreshold', () => {
  let component: GreetingBannerComponent
  const thresholds = buildConfig().postAusencia

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GreetingBannerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    const fixture = TestBed.createComponent(GreetingBannerComponent)
    component = fixture.componentInstance
  })

  it('7 days → null (below minimum threshold of 8)', () => {
    expect(component.findThreshold(thresholds, 7)).toBeNull()
  })

  it('10 days → threshold 8 (highest matching <= 10)', () => {
    const result = component.findThreshold(thresholds, 10)
    expect(result).not.toBeNull()
    expect(result!.minDias).toBe(8)
  })

  it('45 days → threshold 30 (highest matching <= 45)', () => {
    const result = component.findThreshold(thresholds, 45)
    expect(result).not.toBeNull()
    expect(result!.minDias).toBe(30)
  })

  it('0 days (first login) → null', () => {
    expect(component.findThreshold(thresholds, 0)).toBeNull()
  })

  it('exactly 8 days → threshold 8', () => {
    const result = component.findThreshold(thresholds, 8)
    expect(result).not.toBeNull()
    expect(result!.minDias).toBe(8)
  })

  it('exactly 14 days → threshold 14', () => {
    const result = component.findThreshold(thresholds, 14)
    expect(result).not.toBeNull()
    expect(result!.minDias).toBe(14)
  })

  it('exactly 30 days → threshold 30', () => {
    const result = component.findThreshold(thresholds, 30)
    expect(result).not.toBeNull()
    expect(result!.minDias).toBe(30)
  })

  it('unsorted thresholds are sorted before matching', () => {
    const unsorted = [
      { minDias: 30, mensajes: ['A'] },
      { minDias: 8, mensajes: ['B'] },
      { minDias: 14, mensajes: ['C'] }
    ]
    const result = component.findThreshold(unsorted, 20)
    expect(result).not.toBeNull()
    expect(result!.minDias).toBe(14)
  })
})

// ---------------------------------------------------------------------------
// Random pick
// ---------------------------------------------------------------------------

describe('GreetingBannerComponent – pickRandom', () => {
  let component: GreetingBannerComponent

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GreetingBannerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    const fixture = TestBed.createComponent(GreetingBannerComponent)
    component = fixture.componentInstance
  })

  it('returns a string from the given array', () => {
    const arr = ['a', 'b', 'c']
    const result = component.pickRandom(arr)
    expect(arr).toContain(result)
  })

  it('returns the only element when array has size 1', () => {
    expect(component.pickRandom(['unico'])).toBe('unico')
  })

  it('produces different values over repeated calls (statistically)', () => {
    const arr = ['a', 'b', 'c']
    const results = new Set(Array.from({ length: 50 }, () => component.pickRandom(arr)))
    // With 50 picks from 3 items, there is a >99.99% chance all 3 appear
    expect(results.size).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// Placeholder substitution
// ---------------------------------------------------------------------------

describe('GreetingBannerComponent – substituteNombre', () => {
  let component: GreetingBannerComponent

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GreetingBannerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    const fixture = TestBed.createComponent(GreetingBannerComponent)
    component = fixture.componentInstance
  })

  it('replaces {nombre} with the user name', () => {
    expect(component.substituteNombre('¡Hola, {nombre}!', 'María')).toBe('¡Hola, María!')
  })

  it('replaces multiple occurrences of {nombre}', () => {
    expect(component.substituteNombre('{nombre} y {nombre}', 'Lu')).toBe('Lu y Lu')
  })

  it('returns the literal template when there is no placeholder', () => {
    expect(component.substituteNombre('¡Hacía tiempo! 🙌', 'Pedro')).toBe('¡Hacía tiempo! 🙌')
  })
})

// ---------------------------------------------------------------------------
// Dismiss behavior
// ---------------------------------------------------------------------------

describe('GreetingBannerComponent – dismiss', () => {
  let component: GreetingBannerComponent
  let fixture: ComponentFixture<GreetingBannerComponent>

  beforeEach(() => {
    sessionStorage.removeItem('greeting-dismissed')
    TestBed.configureTestingModule({
      imports: [GreetingBannerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    fixture = TestBed.createComponent(GreetingBannerComponent)
    component = fixture.componentInstance
  })

  afterEach(() => {
    sessionStorage.removeItem('greeting-dismissed')
  })

  it('dismiss() sets sessionStorage key and hides the banner', () => {
    component.visible = true
    component.mensaje = '¡Hola!'

    component.dismiss()

    expect(sessionStorage.getItem('greeting-dismissed')).toBe('true')
    expect(component.visible).toBeFalse()
  })

  it('component does not show if sessionStorage already has dismiss key', () => {
    sessionStorage.setItem('greeting-dismissed', 'true')
    fixture = TestBed.createComponent(GreetingBannerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    expect(component.visible).toBeFalse()
    expect(component.mensaje).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Integration: horario fallback for unknown period
// ---------------------------------------------------------------------------

describe('GreetingBannerComponent – horario fallback', () => {
  let component: GreetingBannerComponent

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GreetingBannerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    const fixture = TestBed.createComponent(GreetingBannerComponent)
    component = fixture.componentInstance
  })

  it('falls back to generic greeting when time-of-day key is missing', () => {
    const config = buildConfig({
      horario: { manana: ['Buen día'], noche: ['Buena noche'] } as any
    })
    // tarde is missing; hour 15 (afternoon) should fallback to generic
    const resultado = component.evaluarPrioridad(config, {
      id: '1', nombre: 'Test', apellido: 'User', email: 'test@test.com',
      esCumpleanios: false, diasAusente: 0
    }, 15)
    expect(resultado).toBe('¡Bienvenido, {nombre}!')
  })
})
