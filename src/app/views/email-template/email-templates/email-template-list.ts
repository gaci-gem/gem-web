import { ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { UiCard } from '@app/components/ui-card';
import { EmailTemplateCatalogItem } from '@core/interfaces/email-template';
import { EmailTemplateService } from '@core/services/email-templates';
import { PermisoClave } from '@core/interfaces/rol';
import { PermisoAccion } from '@/app/types/permisos';
import { finalize } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-email-template-list',
  standalone: true,
  imports: [UiCard, TableModule, InputTextModule, ToolbarModule, ConfirmDialogModule, ToastModule, FiltroPresetsComponent, ControlTrabajarCon],
  providers: [MessageService, ConfirmationService],
  templateUrl: './email-template-list.html',
})
export class EmailTemplateList extends TrabajarCon<EmailTemplateCatalogItem> {
  readonly pantalla = 'email-templates';
  private readonly service = inject(EmailTemplateService);
  private readonly router = inject(Router);
  @ViewChild('dt') table?: Table;

  templates: EmailTemplateCatalogItem[] = [];
  cargando = false;
  error = false;

  constructor() {
    super(inject(ChangeDetectorRef), inject(MessageService), inject(ConfirmationService));
    this.permisoClave = 'EMT' as PermisoClave;
  }

  protected loadItems(): void {
    this.cargando = true;
    this.error = false;
    this.loadingService.show();
    this.service.list().pipe(finalize(() => { this.cargando = false; this.loadingService.hide(); this.cdr.detectChanges(); })).subscribe({
      next: templates => this.templates = templates,
      error: () => { this.error = true; this.showError('No se pudo cargar el catálogo de templates de email.'); },
    });
  }

  alta(_item: EmailTemplateCatalogItem): void { this.showError('El catálogo de templates no permite crear registros.'); }
  editar(item: EmailTemplateCatalogItem): void { this.modificar(item); }
  eliminarDirecto(_item: EmailTemplateCatalogItem): void { this.showError('Los templates de email no se pueden eliminar desde este catálogo.'); }
  protected procesarExcel(_file: File): void { this.showError('La importación de templates de email no está disponible.'); }
  protected descargarPlantilla(): void { this.showError('No existe una plantilla de importación para templates de email.'); }
  protected exportarExcelImpl(): void { this.showError('La exportación de templates de email no está disponible.'); }

  puedeModificar(item: EmailTemplateCatalogItem): boolean { return item.editable && this.can(PermisoAccion.MODIFICAR); }
  modificar(item: EmailTemplateCatalogItem): void { if (this.puedeModificar(item)) this.router.navigate(['/email-template', item.clave]); }
  filtrar(event: Event, table: Table): void { table.filterGlobal(this.getEventValue(event), 'contains'); }
}
