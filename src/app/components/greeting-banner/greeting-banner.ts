import { Component, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NgIcon } from '@ng-icons/core'
import { HttpClient } from '@angular/common/http'
import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage'

export interface SaludoConfig {
  prioridad: string[]
  cumpleanios: string[]
  horario: {
    manana: string[]
    tarde: string[]
    noche: string[]
    [key: string]: string[] | undefined
  }
  postAusencia: Array<{
    minDias: number
    mensajes: string[]
  }>
}

const DEFAULT_PRIORIDAD = ['cumpleanios', 'postAusencia', 'horario']
const FALLBACK_GREETING = '¡Bienvenido, {nombre}!'
const DISMISS_KEY = 'greeting-dismissed'

@Component({
  selector: 'app-greeting-banner',
  standalone: true,
  imports: [CommonModule, NgIcon],
  template: `
    @if (visible && mensaje) {
      <div class="greeting-banner d-flex align-items-center justify-content-between px-4 py-3">
        <div class="d-flex align-items-center gap-2">
          <ng-icon name="tablerSparkles" class="greeting-icon"></ng-icon>
          <span class="greeting-text fw-medium">{{ mensaje }}</span>
        </div>
        <button
          type="button"
          class="btn-close ms-3 greeting-close"
          aria-label="Cerrar"
          (click)="dismiss()"
        ></button>
      </div>
    }
  `,
  styles: [`
    .greeting-banner {
      background: linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 100%);
      border: 1px solid #c8e6c9;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      transition: opacity 0.3s ease;
    }

    .greeting-icon {
      color: #43a047;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .greeting-text {
      color: #2e7d32;
      line-height: 1.4;
    }

    .greeting-close {
      opacity: 0.5;
      flex-shrink: 0;
    }

    .greeting-close:hover {
      opacity: 0.9;
    }
  `]
})
export class GreetingBannerComponent implements OnInit {
  private http = inject(HttpClient)
  private userStorage = inject(UserStorageService)

  mensaje = ''
  visible = false

  ngOnInit(): void {
    if (sessionStorage.getItem(DISMISS_KEY)) {
      return
    }

    const usuario = this.userStorage.getUsuario()
    if (!usuario?.nombre) {
      return
    }

    this.http.get<SaludoConfig>('assets/data/saludos.json').subscribe({
      next: (config) => {
        const saludo = this.evaluarPrioridad(config, usuario)
        if (saludo) {
          this.mensaje = this.substituteNombre(saludo, usuario.nombre)
          this.visible = true
        }
      },
      error: () => {
        // Silently fail — banner stays hidden
      }
    })
  }

  /** Evaluate priority array and return the first matching greeting template.
   * @param currentHour Optional hour override (0-23) for deterministic testing.
   */
  evaluarPrioridad(config: SaludoConfig, usuario: UsuarioLogeado, currentHour?: number): string {
    const prioridad = config.prioridad?.length ? config.prioridad : DEFAULT_PRIORIDAD
    const diasAusente = usuario.diasAusente ?? 0

    for (const tipo of prioridad) {
      switch (tipo) {
        case 'cumpleanios': {
          if (usuario.esCumpleanios === true && config.cumpleanios?.length) {
            return this.pickRandom(config.cumpleanios)
          }
          break
        }

        case 'postAusencia': {
          if (diasAusente > 0 && config.postAusencia?.length) {
            const umbral = this.findThreshold(config.postAusencia, diasAusente)
            if (umbral && umbral.mensajes.length) {
              return this.pickRandom(umbral.mensajes)
            }
          }
          break
        }

        case 'horario': {
          const periodo = this.getTimePeriod(currentHour)
          const mensajes = config.horario?.[periodo]
          if (mensajes?.length) {
            return this.pickRandom(mensajes)
          }
          // Fallback if the period key is missing
          return FALLBACK_GREETING
        }
      }
    }

    return ''
  }

  /** Determine time-of-day period from an hour (0-23). Optional param allows test injection. */
  getTimePeriod(hour?: number): string {
    const h = hour ?? new Date().getHours()
    if (h >= 6 && h <= 11) return 'manana'
    if (h >= 12 && h <= 18) return 'tarde'
    return 'noche'
  }

  /** Find the threshold with the highest minDias <= diasAusente. */
  findThreshold(
    thresholds: Array<{ minDias: number; mensajes: string[] }>,
    diasAusente: number
  ): { minDias: number; mensajes: string[] } | null {
    const sorted = [...thresholds].sort((a, b) => b.minDias - a.minDias)
    return sorted.find((t) => t.minDias <= diasAusente) ?? null
  }

  /** Pick a random element from a non-empty array. */
  pickRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  /** Replace {nombre} placeholders with the user's name. */
  substituteNombre(template: string, nombre: string): string {
    return template.replace(/\{nombre\}/g, nombre)
  }

  /** Dismiss the banner and persist for the session. */
  dismiss(): void {
    sessionStorage.setItem(DISMISS_KEY, 'true')
    this.visible = false
  }
}
