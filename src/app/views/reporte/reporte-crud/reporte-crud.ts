import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { Reporte, ReporteEstado, ReporteTipo, getReporteParametrosSugerencia, getReporteTipoDescripcion } from '@core/interfaces/reporte';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-reportes-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './reporte-crud.html',
  styleUrl: './reporte-crud.scss'
})
export class ReporteCrud extends CrudFormModal<Reporte> {

  reporteTipos = Object.values(ReporteTipo);
  getReporteTipoDescripcion = getReporteTipoDescripcion;

  protected buildForm(): FormGroup {
    return new FormGroup({
      id: new FormControl(null),
      tipo: new FormControl('', [Validators.required]),
      parametros: new FormControl(''),
      envMailFin: new FormControl(false, [Validators.required]),
    });
  }

  protected populateForm(data: Reporte): void {
    this.form.patchValue({
      id: data.id,
      tipo: data.tipo,
      parametros: data.parametros,
      envMailFin: data.envMailFin,
    });
  }

  protected override setupEditMode(): void {
  }

  onTipoChange(): void {
    const tipo = this.get('tipo')?.value as ReporteTipo;
    const sugerencia = tipo ? getReporteParametrosSugerencia(tipo) : undefined;
    this.get('parametros')?.setValue(sugerencia ?? '');
  }

  protected toModel(): Reporte {
    return {
      id: this.get('id')?.value,
      tipo: this.get('tipo')?.value,
      parametros: this.get('parametros')?.value,
      envMailFin: this.get('envMailFin')?.value,
    };
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }
}

