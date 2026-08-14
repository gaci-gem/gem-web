import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { TicketService } from '@core/services/ticket';
import { TicketState } from '@core/interfaces/ticket';
import { PermisosService } from '@core/services/permisos';

@Component({
  selector: 'app-ticket-action-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-end mb-2">
      <button
        type="button"
        class="btn btn-link btn-sm text-body-secondary p-1"
        aria-label="Close dialog"
        title="Close dialog"
        (click)="closeWithoutChanges()"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    @if (mode === 'state') {
      <form (ngSubmit)="submit()" class="d-flex flex-column gap-3">
        <label class="form-label">Nuevo estado<select class="form-select" name="state" [(ngModel)]="state" required><option value="">Seleccionar...</option>@for (value of transitions; track value) { <option [value]="value">{{ value }}</option> }</select></label>
        @if (state === 'RECHAZADO') { <label class="form-label">Motivo<input class="form-control" name="reason" [(ngModel)]="reason" /></label> }
        <div class="d-flex justify-content-end gap-2"><button class="btn btn-secondary" type="button" (click)="cancel()" [disabled]="saving">Cancelar</button><button class="btn btn-primary" type="submit" [disabled]="!state || saving">Actualizar</button></div>
      </form>
    } @else if (mode === 'reference') {
      <form (ngSubmit)="submit()" class="d-flex flex-column gap-3"><label class="form-label">Referencia externa<input class="form-control" name="reference" [(ngModel)]="reference" maxlength="255" /></label><div class="d-flex justify-content-end gap-2"><button class="btn btn-secondary" type="button" (click)="cancel()" [disabled]="saving">Cancelar</button><button class="btn btn-primary" type="submit" [disabled]="saving">Guardar</button></div></form>
    } @else {
      <form (ngSubmit)="submit()" class="d-flex flex-column gap-3"><label class="form-label">Respuesta<textarea class="form-control" name="comment" [(ngModel)]="comment" rows="4" maxlength="5000" required></textarea></label><div class="d-flex justify-content-end gap-2"><button class="btn btn-secondary" type="button" (click)="cancel()" [disabled]="saving">Cancelar</button><button class="btn btn-primary" type="submit" [disabled]="!comment.trim() || saving">Enviar</button></div></form>
    }
  `,
})
export class TicketActionDialog {
  private readonly service = inject(TicketService);
  private readonly config = inject(DynamicDialogConfig);
  private readonly ref = inject(DynamicDialogRef);
  private readonly permissions = inject(PermisosService);

  readonly mode: 'state' | 'reference' | 'comment' = this.config.data.mode;
  readonly ticketId: number = this.config.data.ticketId;
  readonly transitions: TicketState[] = this.config.data.transitions ?? [];
  state: TicketState | '' = '';
  reason = '';
  reference = this.config.data.reference ?? '';
  comment = '';
  saving = false;
  private closed = false;

  submit(): void {
    if (!this.permissions.can('TIK.GESTIONAR')) return;
    this.saving = true;
    if (this.mode === 'state') {
      this.service.transition(this.ticketId, this.state as TicketState, this.reason).pipe(finalize(() => this.saving = false)).subscribe({ next: () => this.closeChanged(), error: () => undefined });
    } else if (this.mode === 'reference') {
      this.service.updateExternalReference(this.ticketId, this.reference.trim() || null).pipe(finalize(() => this.saving = false)).subscribe({ next: () => this.closeChanged(), error: () => undefined });
    } else {
      this.service.comment(this.ticketId, this.comment.trim()).pipe(finalize(() => this.saving = false)).subscribe({ next: () => this.closeChanged(), error: () => undefined });
    }
  }

  cancel(): void { this.close(); }

  closeWithoutChanges(): void { this.close(); }

  private closeChanged(): void { this.close({ changed: true }); }

  private close(result?: { changed: true }): void {
    if (this.closed) return;
    this.closed = true;
    this.ref.close(result);
  }
}
