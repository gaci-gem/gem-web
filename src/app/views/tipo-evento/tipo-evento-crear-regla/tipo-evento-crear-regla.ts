import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { TipoEvento } from '@core/interfaces/tipo-evento';
import { PrioridadRegla, PrioridadOperadores, PrioridadContexto } from '@core/interfaces/prioridad-reglas';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { NgIcon } from '@ng-icons/core';
import { PrioridadService } from '@core/services/prioridad-regla';
import { showError, showSuccess } from '@/app/utils/message-utils';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-tipo-evento-crear-regla',
  imports: [
    ReactiveFormsModule,
    ToastModule,
    FormsModule,
    TableModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    NgIcon
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './tipo-evento-crear-regla.html',
  styleUrl: './tipo-evento-crear-regla.scss'
})
export class TipoEventoPrioridadReglas implements OnInit {
  private prioridadService = inject(PrioridadService);
  protected ref = inject(DynamicDialogRef);
  private cdr = inject(ChangeDetectorRef);
  protected config = inject(DynamicDialogConfig);
  protected messageService = inject(MessageService);
  prioridadContexto = PrioridadContexto;
  prioridadOperadores = Object.values(PrioridadOperadores);

  reglasPrioridad: PrioridadRegla[] = [];
  clonedReglas: { [s: string]: PrioridadRegla } = {};

  tipoEventoCodigo: string = '';
  accionEnCurso: 'guardando' | 'eliminando' | null = null;
  reglaEnCursoId: number | null = null;
  estadoAccion: 'guardado' | 'eliminado' | 'error' | null = null;

  ngOnInit(): void {
    this.tipoEventoCodigo = this.config.data.tipoEventoCodigo;
    this.loadReglas();
  }

  loadReglas() {
    this.prioridadService.getByTipo(this.tipoEventoCodigo).subscribe({
      next: (data:PrioridadRegla[]) => {
        console.log(data)
        this.reglasPrioridad = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar las reglas de prioridad:', error);
      }
    });
  }
  
  onRowEditInit(regla: PrioridadRegla) {
    this.clonedReglas[regla.id as number] = { ...regla };
  }

  onRowEditSave(regla: PrioridadRegla) {
    if (this.accionEnCurso) return;
    regla.tipoEventoCodigo = this.tipoEventoCodigo;
    this.accionEnCurso = 'guardando';
    this.reglaEnCursoId = regla.id ?? null;
    this.estadoAccion = null;
    this.prioridadService.upsert(regla).pipe(finalize(() => {
      this.accionEnCurso = null;
      this.reglaEnCursoId = null;
      this.cdr.detectChanges();
    })).subscribe({
      next: (updatedRegla) => {
        this.estadoAccion = 'guardado';
        this.loadReglas();
      },
      error: (error) => {
        this.estadoAccion = 'error';
        console.error('Error al guardar la regla de prioridad:', error);
      }
    });
  }

  onRowEditCancel(regla: PrioridadRegla, index: number) {
    this.reglasPrioridad[index] = this.clonedReglas[regla.id as number];
    delete this.clonedReglas[regla.id as number];
  }

  onRowDelete(regla: PrioridadRegla) {
    if (this.accionEnCurso || !regla.id) return;
    this.accionEnCurso = 'eliminando';
    this.reglaEnCursoId = regla.id;
    this.estadoAccion = null;
    this.prioridadService.delete(regla.id).pipe(finalize(() => {
      this.accionEnCurso = null;
      this.reglaEnCursoId = null;
      this.cdr.detectChanges();
    })).subscribe({
      next: () => {
        this.estadoAccion = 'eliminado';
        this.reglasPrioridad = this.reglasPrioridad.filter(r => r.id !== regla.id);
        this.loadReglas();
      },
      error: (error) => {
        this.estadoAccion = 'error';
        console.error('Error al eliminar la regla de prioridad:', error);
      }
    });
  }

  maxId() {
    return this.reglasPrioridad.length > 0 ? Math.max(...this.reglasPrioridad.map(r => r.id || 0)) : 0;
  }

  addReglaPrioridad() {
    this.reglasPrioridad.push({
      id: this.maxId() + 1,
      contexto: '',
      operador: PrioridadOperadores.IGUAL,
      valor: '',
      peso: 1
    });
  }
  
  showSuccess(summary: string, detail: string) {
    showSuccess(this.messageService, summary, detail);
  }

  showError(summary: string, detail: string) {
    showError(this.messageService, summary, detail);
  }

  cerrarModal() {
    this.ref.close(null);
  }

}
