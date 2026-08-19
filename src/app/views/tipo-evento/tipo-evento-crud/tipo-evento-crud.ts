import { getRandomColor } from '@/app/utils/color-utils';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { Etapa } from '@core/interfaces/etapa';
import { TipoEvento, TipoEventoEtapa } from '@core/interfaces/tipo-evento';
import { EtapaService } from '@core/services/etapa';
import { TipoEventoService } from '@core/services/tipo-evento';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-tipo-evento-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
    FormsModule,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './tipo-evento-crud.html',
  styleUrl: './tipo-evento-crud.scss'
})
export class TipoEventoCrud extends CrudFormModal<TipoEvento> implements OnInit {
  // Para el selector de etapa final
  private etapaService = inject(EtapaService);
  private tipoEventoService = inject(TipoEventoService);
  private cdr = inject(ChangeDetectorRef);
  etapasCatalogo!: Etapa[];
  etapasArchivo!: Etapa[];

  override ngOnInit(): void {
    super.ngOnInit();
    this.etapaService.getAll().subscribe({
      next: (res: Etapa[]) => this.etapasCatalogo = res,
      error: () => this.showError('Error', 'Error al cargar las etapas.')
    });
    this.etapaService.getAllArchivo().subscribe({
      next: (res: Etapa[]) => {
        console.log(res)
        this.etapasArchivo = res
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error', 'Error al cargar las etapas.')
    });
  }

  protected buildForm(): FormGroup {
    return new FormGroup({
      codigo: new FormControl(''),
      descripcion: new FormControl('', [Validators.required]),
      color: new FormControl(getRandomColor()),
      activo: new FormControl(true),
      propio: new FormControl(false),
      facturable: new FormControl(false),
      facturableAuto: new FormControl(false),
      etapas: new FormArray([]),
      etapaFinal: new FormControl(null)
    });
  }

  get etapasFormArray(): FormArray {
    return this.form.get('etapas') as FormArray;
  }

  private createEtapaForm(etapa?: Partial<TipoEventoEtapa>): FormGroup {
    return new FormGroup({
      // obligamos a number (o null)
      etapaId: new FormControl<number | null>(
        etapa?.etapaId != null ? Number(etapa.etapaId) : null,
        [Validators.required]
      ),
      etapaSecuencia: new FormControl<number | null>(
        etapa?.etapaSecuencia != null ? Number(etapa.etapaSecuencia) : null,
        [Validators.required]
      ),
      rollbackSec: new FormControl<number | null>(
        etapa?.rollbackSec != null ? Number(etapa.rollbackSec) : null
      )
    });
  }

  addEtapa() {
    const nextSeq = this.getNextSequence();
    this.etapasFormArray.push(this.createEtapaForm({ etapaSecuencia: nextSeq }));
  }

  removeEtapa(index: number) {
    this.etapasFormArray.removeAt(index);
    this.reorderSequences();
  }

  removeEtapaByControl(control: AbstractControl) {
    const index = this.etapasFormArray.controls.indexOf(control);
    if (index > -1) {
      this.etapasFormArray.removeAt(index);
      this.reorderSequences();
    }
  }
  getRollbackOptions(currentSeq: number): number[] {
    return this.etapasFormArray.controls
      .map(c => c.get('etapaSecuencia')?.value)
      .filter(seq => seq < currentSeq);
  }

  private getNextSequence(): number {
    const secuencias = this.etapasFormArray.controls
      .map(c => Number(c.get('etapaSecuencia')?.value))
      .filter(n => !isNaN(n));
    return secuencias.length ? Math.max(...secuencias) + 1 : 1;
  }

  private reorderSequences() {
    // reasignar secuencias consecutivas
    this.etapasFormArray.controls.forEach((ctrl, i) => {
      ctrl.get('etapaSecuencia')?.setValue(i + 1);
    });

    // limpiar rollbackSec que ya no existan
    this.etapasFormArray.controls.forEach((ctrl) => {
      const rb = ctrl.get('rollbackSec')?.value;
      if (rb != null && rb !== '') {
        const exists = this.etapasFormArray.controls.some(c =>
          Number(c.get('etapaSecuencia')?.value) === Number(rb)
        );
        if (!exists) ctrl.get('rollbackSec')?.setValue(null);
      }
    });
  }

  protected populateForm(data: TipoEvento): void {
    this.form.patchValue({
      codigo: data.codigo,
      descripcion: data.descripcion,
      color: data.color,
      activo: data.activo,
      propio: data.propio,
      facturable: data.facturable,
      facturableAuto: data.facturableAuto
    });

    // Extraer etapa final (secuencia 99) y asignar a etapaFinal
    let etapaFinalId: number | null = null;
    let etapasSinFinal = (data.etapas ?? []).filter(etapa => {
      if (Number(etapa.etapaSecuencia) === 99) {
        etapaFinalId = etapa.etapaId != null ? Number(etapa.etapaId) : null;
        return false;
      }
      return true;
    });
    this.form.get('etapaFinal')?.setValue(etapaFinalId);

    this.etapasFormArray.clear();
    etapasSinFinal.forEach(etapa => {
      this.etapasFormArray.push(this.createEtapaForm({
        etapaId: etapa.etapaId != null ? Number(etapa.etapaId) : undefined,
        etapaSecuencia: etapa.etapaSecuencia != null ? Number(etapa.etapaSecuencia) : undefined,
        rollbackSec: etapa.rollbackSec != null ? Number(etapa.rollbackSec) : undefined
      }));
    });
  }

  protected toModel(): TipoEvento {
    const etapas = this.etapasFormArray.value.map((e: any) => ({
      etapaId: e.etapaId != null ? Number(e.etapaId) : null,
      etapaSecuencia: Number(e.etapaSecuencia),
      rollbackSec: (e.rollbackSec != null && e.rollbackSec !== '') ? Number(e.rollbackSec) : null
    }));
    // Si hay etapa final seleccionada, agregarla como secuencia 99
    console.log(this.form.get('etapaFinal')?.value)
    if (this.form.get('etapaFinal')?.value != null) {
      const etapaFinalObj = this.etapasArchivo.find(e => Number(e.id) === this.form.get('etapaFinal')?.value);
      console.log(etapaFinalObj)
      if (etapaFinalObj) {
        etapas.push({
          etapaId: Number(etapaFinalObj.id),
          etapaSecuencia: 99,
          rollbackSec: null
        });
      }
    }
    return {
      codigo: this.get('codigo')?.value,
      descripcion: this.get('descripcion')?.value,
      color: this.get('color')?.value,
      activo: this.get('activo')?.value,
      propio: this.get('propio')?.value,
      facturable: this.get('facturable')?.value,
      facturableAuto: this.get('facturableAuto')?.value,
      etapas
    };
  }

  protected override save(model: TipoEvento) {
    return this.modo === 'M'
      ? this.tipoEventoService.update(model.codigo, model)
      : this.tipoEventoService.create(model);
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }
}
