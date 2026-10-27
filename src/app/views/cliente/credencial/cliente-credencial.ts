import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { Cliente } from '@core/interfaces/cliente';
import { TicketCredential } from '@core/interfaces/ticket-credential';
import { TicketCredentialService } from '@core/services/ticket-credential';
import { PermisosService } from '@core/services/permisos';
import { LoadingService } from '@core/services/loading.service';

@Component({
  selector: 'app-cliente-credencial',
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cliente-credencial.html',
  styleUrl: './cliente-credencial.scss',
})
export class ClienteCredencial {
  private readonly service = inject(TicketCredentialService);
  private readonly ref = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly permissions = inject(PermisosService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly cliente = this.config.data?.cliente as Cliente;
  readonly form = new FormGroup({
    login: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });
  credentials: TicketCredential[] = [];
  loading = false;

  canManage(): boolean { return this.permissions.can('CLI.GEN_PORTAL'); }

  ngOnInit(): void {
    this.load();
  }

  load(showGlobalLoading = true): void {
    if (!this.cliente.id) return;
    if (showGlobalLoading) this.loadingService.show();
    this.service.list(this.cliente.id).pipe(
      finalize(() => {
        if (showGlobalLoading) this.loadingService.hide();
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (items) => {
        this.credentials = items;
      },
      error: (error) => {
        this.showError(error);
      },
    });
  }

  create(): void {
    if (this.loading) return;
    if (!this.canManage()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.cliente.id) return;
    this.loading = true;
    this.loadingService.show();
    this.service.create(this.cliente.id, this.form.getRawValue()).pipe(finalize(() => { this.loading = false; this.loadingService.hide(); this.cdr.detectChanges(); })).subscribe({
       next: () => { this.form.reset(); this.load(false); this.messageService.add({ severity: 'success', summary: 'Credencial creada', detail: 'La contraseña temporal fue enviada por correo electrónico.' }); },
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  rotate(credential: TicketCredential): void {
    if (this.loading) return;
    if (!this.canManage()) return;
    if (!this.cliente.id) return;
    this.loading = true;
    this.loadingService.show();
    this.service.rotate(this.cliente.id, credential.id).pipe(finalize(() => { this.loading = false; this.loadingService.hide(); this.cdr.detectChanges(); })).subscribe({
       next: () => { this.load(false); this.messageService.add({ severity: 'success', summary: 'Contraseña renovada', detail: 'La nueva contraseña temporal fue enviada por correo electrónico.' }); },
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  toggle(credential: TicketCredential): void {
    if (this.loading) return;
    if (!this.canManage()) return;
    if (!this.cliente.id) return;
    this.loading = true;
    this.loadingService.show();
    this.service.update(this.cliente.id, credential.id, { activo: !credential.activo }).pipe(finalize(() => { this.loading = false; this.loadingService.hide(); this.cdr.detectChanges(); })).subscribe({
      next: () => this.load(false), error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  actualizarPreferencia(credential: TicketCredential, campo: 'enviarConfirmacionesTicket' | 'enviarActualizacionesTicket' | 'recibirActualizacionesTodosLosTickets', valor: boolean): void {
    if (this.loading || !this.canManage() || !this.cliente.id) return;
    this.loading = true;
    this.loadingService.show();
    this.service.update(this.cliente.id, credential.id, { [campo]: valor }).pipe(finalize(() => { this.loading = false; this.loadingService.hide(); this.cdr.detectChanges(); })).subscribe({
      next: () => this.load(false),
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  confirmToggle(credential: TicketCredential): void {
    this.confirmationService.confirm({ header: credential.activo ? 'Desactivar credencial' : 'Activar credencial', message: '¿Desea continuar con este cambio de acceso?', accept: () => this.toggle(credential) });
  }

  cerrar(): void { this.ref.close(); }

  private showError(error: HttpErrorResponse): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'La operación de credencial falló.' });
  }
}
