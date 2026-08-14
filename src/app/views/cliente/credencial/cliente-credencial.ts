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
  private cdr = inject(ChangeDetectorRef);

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

  load(): void {
    if (!this.cliente.id) return;
    this.service.list(this.cliente.id).pipe(
      finalize(() => {
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
    if (!this.canManage()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.cliente.id) return;
    this.loading = true;
    this.service.create(this.cliente.id, this.form.getRawValue()).pipe(finalize(() => this.loading = false)).subscribe({
      next: () => { this.form.reset(); this.load(); this.messageService.add({ severity: 'success', summary: 'Credential created', detail: 'The temporary password was sent by email.' }); },
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  rotate(credential: TicketCredential): void {
    if (!this.canManage()) return;
    if (!this.cliente.id) return;
    this.loading = true;
    this.service.rotate(this.cliente.id, credential.id).pipe(finalize(() => this.loading = false)).subscribe({
      next: () => { this.load(); this.messageService.add({ severity: 'success', summary: 'Password rotated', detail: 'The new temporary password was sent by email.' }); },
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  toggle(credential: TicketCredential): void {
    if (!this.canManage()) return;
    if (!this.cliente.id) return;
    this.loading = true;
    this.service.update(this.cliente.id, credential.id, { activo: !credential.activo }).pipe(finalize(() => this.loading = false)).subscribe({
      next: () => this.load(), error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  confirmToggle(credential: TicketCredential): void {
    this.confirmationService.confirm({ header: credential.activo ? 'Deactivate credential' : 'Activate credential', message: 'Continue with this access change?', accept: () => this.toggle(credential) });
  }

  cerrar(): void { this.ref.close(); }

  private showError(error: HttpErrorResponse): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Credential operation failed.' });
  }
}
