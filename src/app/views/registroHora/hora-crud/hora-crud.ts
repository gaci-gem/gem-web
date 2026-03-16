import { modalConfig } from '@/app/types/modals';
import { formatTime } from '@/app/utils/datetime-utils';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CrudFormModal, LoadingSpinnerComponent } from '@app/components/index';
import { Evento } from '@core/interfaces/evento';
import { Hora, RegistroHora } from '@core/interfaces/registro-hora';
import { EventoService } from '@core/services/evento';
import { RegistroHoraService } from '@core/services/registro-hora';
import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage';
import { NgIcon } from '@ng-icons/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { EventoSelect } from '../../evento/evento-select/evento-select';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FiltroActivo } from '@/app/constants/filtros_activo';

@Component({
  selector: 'app-hora-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
    NgIcon,
    LoadingSpinnerComponent,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './hora-crud.html',
  styleUrl: './hora-crud.scss'
})
export class HoraCrud extends CrudFormModal<RegistroHora> {
  protected modalSel!: DynamicDialogRef | null;
  private eventoService = inject(EventoService)
  private userStorageService = inject(UserStorageService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();

  eventos!: Evento[];
  eventosFiltrados!: Evento[];

  loading: boolean = false;
  private dataLoadedCount = 0;
  private totalDataToLoad = 1;

  override ngOnInit(): void {
    super.ngOnInit();

    if (this.modo === 'M') {
      this.loading = true;
      // this.loadingService.show();
    }

    this.eventoService.getAll(FiltroActivo.FALSE).subscribe({
      next: (res: any) => {
        this.eventos = res
        this.checkAndSetupEditMode();
      },
      error: () => this.showError('Error', 'Error al cargar los eventos.')
    })
  }

  protected buildForm(): FormGroup {
    const today = new Date().toISOString().slice(0, 10);
    return new FormGroup({
      id: new FormControl('',),
      fecha: new FormControl(today, [Validators.required]),
      usuarioId: new FormControl(this.usuarioActivo?.id, [Validators.required]),
      horas: new FormArray([], this.noOverlapValidator.bind(this))
    });
  }

  get horasFormArray(): FormArray {
    return this.form.get('horas') as FormArray;
  }

  protected populateForm(data: RegistroHora): void {
    const fechaStr = data.fecha ? new Date(data.fecha).toISOString().slice(0, 10) : '';
    this.form.patchValue({
      id: data.id,
      fecha: fechaStr,
      usuarioId: data.usuarioId,
      horas: []
    });

    this.horasFormArray.clear();
    data.horas?.forEach(hora => {
      const inicioStr = hora.inicio ? formatTime(hora.inicio) : '';
      const finStr = hora.fin ? formatTime(hora.fin) : '';

      this.horasFormArray.push(this.createHoraForm({
        id: hora.id != null ? Number(hora.id) : undefined,
        registroId: hora.registroId != null ? Number(hora.registroId) : undefined,
        eventoId: hora.eventoId != null ? String(hora.eventoId) : undefined,
        inicio: inicioStr,
        fin: finStr,
        detalle: hora.detalle != null ? String(hora.detalle) : undefined
      }));
    });
  }

  protected override setupEditMode(): void {
  }

  protected toModel(): RegistroHora {
    return {
      id: this.get('id')?.value,
      fecha: this.get('fecha')?.value,
      usuarioId: this.get('usuarioId')?.value,
      horas: this.horasFormArray.value.map((h: any) => ({
        // id: h.id != null ? Number(h.id) : null,
        // registroId: h.registroId != null ? Number(h.registroId) : null,
        eventoId: h.eventoId != null ? String(h.eventoId) : null,
        inicio: h.inicio != null ? String(h.inicio) : null,
        fin: h.fin != null ? String(h.fin) : null,
        detalle: h.detalle != null ? String(h.detalle) : null
      }))
    };
  }

  accion(event: Event) {
    event.preventDefault();
    console.log(event)
    this.submit();
  }

  private createHoraForm(hora?: Partial<Hora>): FormGroup {
    const horaForm = new FormGroup({
      // obligamos a number (o null)
      id: new FormControl<number | null>(
        hora?.id != null ? Number(hora.id) : null,
      ),
      registroId: new FormControl<number | null>(
        hora?.registroId != null ? Number(hora.registroId) : null,
      ),
      eventoId: new FormControl<string | null>(
        hora?.eventoId != null ? String(hora.eventoId) : null,
        [Validators.required]
      ),
      inicio: new FormControl<string | null>(
        hora?.inicio != null ? String(hora.inicio) : null,
        [Validators.required, this.timeFormatValidator.bind(this)]
      ),
      fin: new FormControl<string | null>(
        hora?.fin != null ? String(hora.fin) : null,
        [Validators.required, this.timeFormatValidator.bind(this)]
      ),
      detalle: new FormControl<string | null>(
        hora?.detalle != null ? String(hora.detalle) : null,
      ),
    }, { validators: this.timeRangeValidator });

    // Agregar validación cuando cambian los valores de tiempo
    horaForm.get('inicio')?.valueChanges.subscribe(() => {
      this.horasFormArray.updateValueAndValidity();
    });
    horaForm.get('fin')?.valueChanges.subscribe(() => {
      this.horasFormArray.updateValueAndValidity();
    });

    return horaForm;
  }

  addHora() {
    this.horasFormArray.push(this.createHoraForm());
  }

  removeHora(index: number) {
    this.horasFormArray.removeAt(index);
    this.horasFormArray.updateValueAndValidity();
  }

  // Validador personalizado para evitar superposición de horarios
  private noOverlapValidator(control: AbstractControl): ValidationErrors | null {
    const horasArray = control as FormArray;
    
    if (!horasArray || horasArray.length <= 1) {
      return null;
    }

    const horarios = horasArray.controls
      .map((horaControl, index) => ({
        index,
        inicio: horaControl.get('inicio')?.value,
        fin: horaControl.get('fin')?.value
      }))
      .filter(h => {
        if (!h.inicio || !h.fin) {
          return false;
        }

        if (!this.isValid24hTime(h.inicio) || !this.isValid24hTime(h.fin)) {
          return false;
        }

        const inicio = this.timeToMinutes(h.inicio);
        const fin = this.timeToMinutes(h.fin);

        return inicio !== null && fin !== null && inicio <= fin;
      });

    // Verificar superposiciones
    for (let i = 0; i < horarios.length; i++) {
      for (let j = i + 1; j < horarios.length; j++) {
        const horario1 = horarios[i];
        const horario2 = horarios[j];

        // Convertir a minutos para facilitar comparación
        const inicio1 = this.timeToMinutes(horario1.inicio);
        const fin1 = this.timeToMinutes(horario1.fin);
        const inicio2 = this.timeToMinutes(horario2.inicio);
        const fin2 = this.timeToMinutes(horario2.fin);

        if (inicio1 === null || fin1 === null || inicio2 === null || fin2 === null) {
          continue;
        }

        // Verificar si hay superposición (excluyendo los extremos)
        if ((inicio1 < fin2 && fin1 > inicio2)) {
          // Marcar error en ambos controles
          horasArray.at(horario1.index).setErrors({ overlap: true });
          horasArray.at(horario2.index).setErrors({ overlap: true });
          return { overlap: true };
        }
      }
    }

    // Limpiar errores de superposición si no hay conflictos
    horasArray.controls.forEach(control => {
      const errors = control.errors;
      if (errors && errors['overlap']) {
        delete errors['overlap'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    });

    return null;
  }

  private timeToMinutes(time: string): number | null {
    if (!this.isValid24hTime(time)) {
      return null;
    }

    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isValid24hTime(time: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
  }

  private timeFormatValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    return this.isValid24hTime(String(value)) ? null : { invalidTimeFormat: true };
  }

  // Validador para verificar que fin sea mayor que inicio
  private timeRangeValidator(group: AbstractControl): ValidationErrors | null {
    const inicio = group.get('inicio')?.value;
    const fin = group.get('fin')?.value;

    if (!inicio || !fin) {
      return null;
    }

    if (!this.isValid24hTime(inicio) || !this.isValid24hTime(fin)) {
      return { invalidTimeFormat: true };
    }

    const inicioTotal = this.timeToMinutes(inicio);
    const finTotal = this.timeToMinutes(fin);

    if (inicioTotal === null || finTotal === null) {
      return { invalidTimeFormat: true };
    }

    if (finTotal <= inicioTotal) {
      return { invalidTimeRange: true };
    }

    return null;
  }

  modalSelEvento(hora:any, event: Event) {
    event.preventDefault();
    this.modalSel = this.dialogService.open(EventoSelect, {
      ...modalConfig,
      header: "Seleccionar Evento",
      data: {
        filtroEvento: FiltroActivo.FALSE
      }
    });

    if (!this.modalSel) return;

    this.modalSel.onClose.subscribe((result: any) => {
      if (!result) return;
      hora.patchValue({
        eventoId: result.id
      })
    });
  }
  
  private checkAndSetupEditMode() {
    this.dataLoadedCount++;
    if (this.dataLoadedCount === this.totalDataToLoad) {
      if (this.modo === 'M') {
        this.setupEditMode();
        // Usar setTimeout para evitar el error NG0100
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    }
  }

}
