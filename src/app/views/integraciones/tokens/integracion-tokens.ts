import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { UiCard } from '@app/components/ui-card';
import { IntegrationTokenRequest, IntegrationTokenResponse } from '@core/interfaces/integration-token';
import { IntegrationTokenService } from '@core/services/integration-token';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { NgIcon } from '@ng-icons/core';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-integracion-tokens',
  standalone: true,
  imports: [CommonModule, FormsModule, UiCard, TableModule, ToolbarModule, ToastModule, ConfirmDialogModule, DialogModule, InputTextModule, CheckboxModule, NgIcon],
  providers: [MessageService, ConfirmationService],
  templateUrl: './integracion-tokens.html',
  styleUrl: './integracion-tokens.scss',
})
export class IntegracionTokensComponent extends TrabajarCon<IntegrationTokenResponse> {
  readonly pantalla = 'integracion-tokens';
  private readonly service = inject(IntegrationTokenService);
  @ViewChild('dt') table?: Table;
  tokens: IntegrationTokenResponse[] = [];
  dialogVisible = false;
  secretDialogVisible = false;
  secret: string | null = null;
  form: IntegrationTokenRequest = { label: '', kind: 'service', scopes: [] };
  readonly scopesValidos = ['eventos:read', 'tickets:read'];

  constructor() {
    super(inject(ChangeDetectorRef), inject(MessageService), inject(ConfirmationService));
  }

  puede(permiso: string): boolean { return this.permisosService.can(permiso as never); }
  protected loadItems(): void {
    if (!this.puede('INTTOKEN.VER')) return;
    this.loadingService.show();
    this.service.listExternal().pipe(finalize(() => this.loadingService.hide())).subscribe({
      next: tokens => { this.tokens = tokens.filter(token => token.kind !== 'mcp'); this.cdr.detectChanges(); },
      error: err => this.showError(err?.error?.message || 'No se pudieron cargar los tokens.'),
    });
  }
  alta(_item: IntegrationTokenResponse): void { this.crear(); }
  editar(_item: IntegrationTokenResponse): void {}
  eliminarDirecto(item: IntegrationTokenResponse): void { this.revocar(item); }
  protected procesarExcel(_file: File): void {}
  protected descargarPlantilla(): void {}
  protected exportarExcelImpl(): void {}

  abrirCrear(): void { this.form = { label: '', kind: 'service', scopes: [] }; this.dialogVisible = true; }
  crear(): void {
    if (!this.form.label?.trim() || !['service', 'discord'].includes(this.form.kind || '')) return;
    if (!this.form.scopes?.length) { this.showError('Seleccioná al menos un scope.'); return; }
    if (!this.beginAction()) return;
    const request = { ...this.form, label: this.form.label.trim(), scopes: [...this.form.scopes] };
    this.service.createExternal(request).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: response => { this.dialogVisible = false; this.secret = response.token || null; this.secretDialogVisible = true; this.afterChange('Token creado correctamente.'); },
      error: err => this.showError(err?.error?.message || 'No se pudo crear el token.'),
    });
  }
  revocar(token: IntegrationTokenResponse): void {
    if (!this.beginAction()) return;
    this.service.revokeExternal(token.id).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Token revocado correctamente.'),
      error: err => this.showError(err?.error?.message || 'No se pudo revocar el token.'),
    });
  }
  copiarSecreto(): void { if (this.secret) navigator.clipboard?.writeText(this.secret); }
  estado(token: IntegrationTokenResponse): string { return token.revokedAt ? 'Revocado' : token.expiresAt && new Date(token.expiresAt) < new Date() ? 'Vencido' : 'Activo'; }
  formatDate(value?: string | null): string { return value ? new Date(value).toLocaleString() : '—'; }
}
