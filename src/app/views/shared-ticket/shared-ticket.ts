import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService, SharedTicketResponse } from '@core/services/ticket';
import { AuthService } from '@core/services/auth';
import { environment } from '@/environments/environment';
import { AppLogo } from '@app/components/app-logo';

export const SHARED_TICKET_RETURN_URL_KEY = 'gem-web.shared-ticket.return-url';

@Component({
  selector: 'app-shared-ticket',
  standalone: true,
  imports: [CommonModule, AppLogo],
  template: `
    <main class="shared-ticket-page d-flex align-items-center justify-content-center min-vh-100 px-3 py-4 bg-body-tertiary">
      <section class="shared-ticket-card card border-0 shadow-sm w-100" aria-labelledby="shared-ticket-title">
        <div class="card-body p-4 p-md-5 text-center" *ngIf="response; else estado">
          <div class="mb-4"><app-app-logo [logoMaxWidth]="170" /></div>
          <p class="text-uppercase small fw-semibold text-primary mb-2">Ticket compartido</p>
          <h1 id="shared-ticket-title" class="h3 fw-bold mb-3">Elegí dónde abrir tu ticket</h1>
          <p class="text-body-secondary mb-4">Seleccioná el sistema que querés utilizar para continuar.</p>
          <div class="d-grid gap-2 d-sm-flex justify-content-center" *ngIf="response.destinos.length > 1">
            <button type="button" class="btn btn-primary px-4" *ngIf="response.destinos.includes('GEM_WEB')" (click)="seleccionarDestino('GEM_WEB')">Interno</button>
            <button type="button" class="btn btn-outline-primary px-4" *ngIf="response.destinos.includes('GEM_CLIENTES')" (click)="seleccionarDestino('GEM_CLIENTES')">Externo</button>
          </div>
        </div>
        <ng-template #estado>
          <div class="card-body p-4 p-md-5 text-center" aria-live="polite">
            <div class="mb-4"><app-app-logo [logoMaxWidth]="170" /></div>
            <div *ngIf="loading" class="spinner-border text-primary mb-3" role="status"><span class="visually-hidden">Cargando ticket compartido</span></div>
            <p class="mb-0" [class.text-danger]="!!error" [attr.role]="error ? 'alert' : null">{{ error || (loading ? 'Cargando ticket compartido…' : 'No se pudo resolver el link compartido.') }}</p>
          </div>
        </ng-template>
      </section>
    </main>
  `,
  styles: [`.shared-ticket-card { max-width: 30rem; }`],
})
export class SharedTicket implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(TicketService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  response: SharedTicketResponse | null = null;
  error = '';
  loading = true;

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) { this.loading = false; this.error = 'El link compartido no es válido.'; return; }
    this.service.resolverLinkCompartido(token).subscribe({
      next: (response) => {
        this.response = response;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'El link compartido no existe, fue revocado o expiró.';
        this.cdr.detectChanges();
      },
    });
  }

  seleccionarDestino(destino: 'GEM_WEB' | 'GEM_CLIENTES', token = this.route.snapshot.paramMap.get('token') ?? ''): void {
    if (destino === 'GEM_CLIENTES') {
      window.location.assign(`${environment.gemClientesUrl}/shared/ticket/${encodeURIComponent(token)}`);
      return;
    }
    this.authService.verifyToken().subscribe({
      next: authenticated => authenticated ? this.openTicket(token) : this.redirectToLogin(token),
      error: () => this.redirectToLogin(token),
    });
  }

  private redirectToLogin(token: string): void {
    const returnUrl = `/gem-clientes/tickets?sharedTicketToken=${encodeURIComponent(token)}`;
    sessionStorage.setItem(SHARED_TICKET_RETURN_URL_KEY, returnUrl);
    window.location.assign(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  private openTicket(token: string): void {
    void this.router.navigate(['/gem-clientes/tickets'], { queryParams: { sharedTicketToken: token } });
  }
}
