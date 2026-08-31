import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { IntegrationTokenService } from '@core/services/integration-token';
import { IntegrationSetupModalComponent } from './integration-setup-modal/integration-setup-modal';
import { finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-tab-integraciones',
  standalone: true,
  imports: [NgIcon, IntegrationSetupModalComponent],
  template: `
    <div class="border rounded p-3">
      <div class="d-flex align-items-center justify-content-between gap-3">
        <div>
          <div class="fw-semibold">gem-mcp</div>
          <div class="small text-muted mt-1">
            Credencial técnica para conectar GEM con tus herramientas.
          </div>
        </div>
        @if (tokenPreview || tokenActual) {
          <span class="badge bg-success-subtle text-success-emphasis"
            >Configurado</span
          >
        }
      </div>
      <div class="d-flex align-items-center flex-wrap gap-2 mt-3">
        @if (tokenPreview || tokenActual) {
          <span
            >Token:
            <code class="text-truncate" [title]="tokenAcortado">{{
              tokenAcortado
            }}</code></span
          >
          @if (tokenActual) {
            <button
              type="button"
              class="btn btn-link p-0 text-primary flex-shrink-0"
              (click)="copiarToken()"
              [attr.aria-label]="
                copiaExitosa ? 'Token copiado' : 'Copiar token gem-mcp'
              "
              title="Copiar token gem-mcp"
            >
              <ng-icon name="tablerCopy" size="16" aria-hidden="true" />
              <span class="visually-hidden">{{
                copiaExitosa ? 'Token copiado' : 'Copiar token'
              }}</span>
            </button>
          } @else {
            <span class="text-muted small"
              >Solo podés copiar el token en el momento en que se genera.</span
            >
          }
        } @else {
          <span class="text-muted small"
            >Todavía no hay un token generado.</span
          >
        }
      </div>
      @if (tokenActual) {
        <div class="text-warning small mt-3" role="note">
          Regenerar el token revoca el token MCP activo anterior.
        </div>
      }
      <div class="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          (click)="generarToken()"
          [disabled]="cargando"
          [attr.aria-busy]="cargando"
        >
          {{
            cargando
              ? 'Generando...'
              : tokenActual
                ? 'Regenerar token'
                : 'Generar token'
          }}
        </button>
        @if (tokenId) {
          <button
            type="button"
            class="btn btn-outline-danger btn-sm"
            (click)="revocarToken()"
            [disabled]="cargando"
            >
             Eliminar token
          </button>
        }
        <button
          type="button"
          class="btn btn-outline-primary btn-sm"
          (click)="mostrarConfiguracion = true"
        >
          Cómo configurar
        </button>
      </div>
    </div>
    @if (copiaExitosa) {
      <div class="text-success small mt-2" role="status">
        Token copiado al portapapeles.
      </div>
    }
    @if (copyError) {
      <div class="text-danger small mt-2" role="status">{{ copyError }}</div>
    }
    @if (error) {
      <div class="text-danger small mt-2" role="alert">{{ error }}</div>
    }
    <app-integration-setup-modal [(visible)]="mostrarConfiguracion" />
  `,
})
export class TabIntegraciones implements OnInit, OnDestroy {
  private readonly tokenService = inject(IntegrationTokenService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private cdf = inject(ChangeDetectorRef);

  mostrarConfiguracion = false;
  tokenActual: string | null = null;
  tokenPreview: string | null = null;
  tokenId: string | null = null;
  cargando = false;
  error: string | null = null;
  copiaExitosa = false;
  copyError: string | null = null;

  ngOnInit(): void {
    this.cargando = true;
    this.tokenService
      .list()
      .pipe(finalize(() => this.cdf.detectChanges()))
      .subscribe({
        next: (tokens) => {
          const activeToken = tokens.find((token) => !token.revokedAt);
          this.tokenId = activeToken?.id ?? null;
          this.tokenPreview = activeToken?.tokenPreview ?? null;
          this.cargando = false;
        },
        error: (response) => {
          this.error =
            response?.error?.message || 'No se pudo cargar el token MCP.';
          this.cargando = false;
        },
      });
  }

  get tokenAcortado(): string {
    if (this.tokenPreview) return this.tokenPreview;
    if (!this.tokenActual) return '';
    return this.tokenActual.length > 12
      ? `${this.tokenActual.slice(0, 9)}${'*'.repeat(16)}${this.tokenActual.slice(-3)}`
      : this.tokenActual;
  }

  generarToken(): void {
    if (this.cargando) return;

    if (this.tokenId) {
      this.confirmationService.confirm({
        header: 'Regenerar token MCP',
        message: 'El token MCP activo dejará de funcionar. ¿Querés regenerarlo?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Regenerar',
        rejectLabel: 'Cancelar',
        accept: () => this.crearToken(),
      });
      return;
    }

    this.crearToken();
  }

  private crearToken(): void {
    if (this.cargando) return;

    this.cargando = true;
    this.error = null;
    this.copiaExitosa = false;
    this.copyError = null;
    this.tokenService
      .create({ label: 'gem-mcp', kind: 'mcp' })
      .pipe(finalize(() => this.cdf.detectChanges()))
      .subscribe({
        next: (response) => {
          this.tokenId = response.id;
          this.tokenActual = response.token ?? null;
          this.tokenPreview = response.tokenPreview;
          this.cargando = false;
        },
        error: (response) => {
          this.error =
            response?.error?.message || 'No se pudo generar el token MCP.';
          this.cargando = false;
        },
      });
  }

  revocarToken(): void {
    if (!this.tokenId || this.cargando) return;

    this.confirmationService.confirm({
      header: 'Eliminar token MCP',
      message: 'El token dejará de funcionar y no se podrá recuperar. ¿Querés eliminarlo?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.cargando = true;
        this.error = null;
        this.tokenService
          .revoke(this.tokenId!)
          .pipe(finalize(() => this.cdf.detectChanges()))
          .subscribe({
            next: () => {
              this.tokenId = null;
              this.tokenActual = null;
              this.tokenPreview = null;
              this.messageService.add({
                severity: 'success',
                summary: 'Token revocado',
                detail: 'El token MCP ya no puede utilizarse.',
              });
              this.cargando = false;
            },
            error: (response) => {
              this.error =
                response?.error?.message || 'No se pudo revocar el token MCP.';
              this.cargando = false;
            },
          });
      },
    });
  }

  async copiarToken(): Promise<void> {
    if (!this.tokenActual) return;
    this.copyError = null;
    this.copiaExitosa = false;
    try {
      await navigator.clipboard.writeText(this.tokenActual);
      this.copiaExitosa = true;
    } catch {
      this.copyError = 'No se pudo copiar el token. Copialo manualmente.';
    }
  }

  ngOnDestroy(): void {
    this.tokenActual = null;
    this.tokenPreview = null;
    this.tokenId = null;
    this.error = null;
  }
}
