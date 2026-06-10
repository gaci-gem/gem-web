import { modalConfig } from '@/app/types/modals';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CrudFormModal, LoadingSpinnerComponent } from '@app/components/index';
import { Evento } from '@core/interfaces/evento';
import { Categoria, Hora, RegistroHora } from '@core/interfaces/registro-hora';
import { EventoService } from '@core/services/evento';
import { RegistroHoraService } from '@core/services/registro-hora';
import {
  UserStorageService,
  UsuarioLogeado,
} from '@core/services/user-storage';
import { NgIcon } from '@ng-icons/core';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { EventoSelect } from '../../evento/evento-select/evento-select';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-hora-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
    DatePickerModule,
    NgIcon,
    LoadingSpinnerComponent,
    SelectModule,
  ],
  providers: [MessageService],
  templateUrl: './hora-crud.html',
  styleUrl: './hora-crud.scss',
})
export class HoraCrud extends CrudFormModal<RegistroHora> {
  protected modalSel!: DynamicDialogRef | null;
  private eventoService = inject(EventoService);
  private registroHoraService = inject(RegistroHoraService);
  private userStorageService = inject(UserStorageService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();

  eventos!: Evento[];
  eventosFiltrados!: Evento[];

  categorias: Categoria[] = [];
  categoriaSugerida: Categoria | null = null;

  loading: boolean = false;
  private dataLoadedCount = 0;
  private totalDataToLoad = 2;

  override ngOnInit(): void {
    super.ngOnInit();

    if (this.modo === 'M') {
      this.loading = true;
    }

    // Categorías sugerida desde el config (evento)
    if (this.config.data?.categoriaSugerida) {
      this.categoriaSugerida = this.config.data.categoriaSugerida;
    }

    // Cargar categorías desde el backend
    this.registroHoraService
      .getCategorias()
      .pipe(finalize(() => this.cdr.detectChanges()))
      .subscribe({
        next: (cats) => {
          this.categorias = cats;
          this.checkAndSetupEditMode();
        },
        error: () => {
          this.showError('Error', 'Error al cargar las categorías.');
          this.checkAndSetupEditMode();
        },
      });

    // Cargar eventos
    this.eventoService.getAll(FiltroActivo.FALSE).subscribe({
      next: (res: any) => {
        this.eventos = res;
        this.checkAndSetupEditMode();
      },
      error: () => this.showError('Error', 'Error al cargar los eventos.'),
    });
  }

  protected buildForm(): FormGroup {
    const today = new Date().toISOString().slice(0, 10);
    return new FormGroup({
      id: new FormControl(''),
      fecha: new FormControl(today, [Validators.required]),
      usuarioId: new FormControl(this.usuarioActivo?.id, [Validators.required]),
      horas: new FormArray([], this.noOverlapValidator.bind(this)),
    });
  }

  get horasFormArray(): FormArray {
    return this.form.get('horas') as FormArray;
  }

  protected populateForm(data: RegistroHora): void {
    const fechaStr = data.fecha
      ? new Date(data.fecha).toISOString().slice(0, 10)
      : '';
    this.form.patchValue({
      id: data.id,
      fecha: fechaStr,
      usuarioId: data.usuarioId,
      horas: [],
    });

    this.horasFormArray.clear();
    data.horas?.forEach((hora) => {
      this.horasFormArray.push(
        this.createHoraForm({
          id: hora.id != null ? Number(hora.id) : undefined,
          registroId:
            hora.registroId != null ? Number(hora.registroId) : undefined,
          eventoId: hora.eventoId != null ? String(hora.eventoId) : undefined,
          inicio: hora.inicio,
          fin: hora.fin,
          detalle: hora.detalle != null ? String(hora.detalle) : undefined,
          categoriaCodigo:
            hora.categoriaCodigo != null
              ? String(hora.categoriaCodigo)
              : undefined,
        }),
      );
    });
  }

  protected override setupEditMode(): void {}

  protected toModel(): RegistroHora {
    return {
      id: this.get('id')?.value,
      fecha: this.get('fecha')?.value,
      usuarioId: this.get('usuarioId')?.value,
      horas: this.horasFormArray.value.map((h: any) => ({
        // id: h.id != null ? Number(h.id) : null,
        // registroId: h.registroId != null ? Number(h.registroId) : null,
        eventoId: h.eventoId != null ? String(h.eventoId) : null,
        inicio: this.formatControlTime(h.inicio),
        fin: this.formatControlTime(h.fin),
        detalle: h.detalle != null ? String(h.detalle) : null,
        categoriaCodigo:
          h.categoriaCodigo != null ? String(h.categoriaCodigo) : null,
      })),
    };
  }

  accion(event: Event) {
    event.preventDefault();
    this.normalizeAllTimeControls();
    this.submit();
  }

  private createHoraForm(hora?: Partial<Hora>): FormGroup {
    const horaForm = new FormGroup(
      {
        // obligamos a number (o null)
        id: new FormControl<number | null>(
          hora?.id != null ? Number(hora.id) : null,
        ),
        registroId: new FormControl<number | null>(
          hora?.registroId != null ? Number(hora.registroId) : null,
        ),
        eventoId: new FormControl<string | null>(
          hora?.eventoId != null ? String(hora.eventoId) : null,
          [Validators.required],
        ),
        inicio: new FormControl<Date | null>(
          this.coerceTimeControlValue(hora?.inicio),
          [Validators.required],
        ),
        fin: new FormControl<Date | null>(
          this.coerceTimeControlValue(hora?.fin),
          [Validators.required],
        ),
        detalle: new FormControl<string | null>(
          hora?.detalle != null ? String(hora.detalle) : null,
        ),
        categoriaCodigo: new FormControl<string | null>(
          hora?.categoriaCodigo != null ? String(hora.categoriaCodigo) : null,
        ),
      },
      { validators: this.timeRangeValidator.bind(this) },
    );

    // Agregar validación cuando cambian los valores de tiempo
    horaForm.get('inicio')?.valueChanges.subscribe(() => {
      this.horasFormArray.updateValueAndValidity();
    });
    horaForm.get('fin')?.valueChanges.subscribe(() => {
      this.horasFormArray.updateValueAndValidity();
    });

    // Cuando cambia el evento seleccionado, buscar categoriaSugerida
    horaForm.get('eventoId')?.valueChanges.subscribe((eventoId) => {
      if (eventoId) {
        this.cargarCategoriaSugeridaDeEvento(String(eventoId));
      }
    });

    return horaForm;
  }

  onPrimeTimeBlur(
    horaControl: AbstractControl,
    field: 'inicio' | 'fin',
    event?: Event,
  ): void {
    const control = horaControl.get(field);
    if (!control) {
      return;
    }

    const rawValue = this.getEventInputValue(event);
    const candidateValue = rawValue ?? control.value;
    const normalized = this.normalizeTimeValue(candidateValue);
    const normalizedDate = this.coerceTimeControlValue(normalized);

    if (normalizedDate && !this.areDatesEqual(control.value, normalizedDate)) {
      control.setValue(normalizedDate);
      control.markAsDirty();
      control.markAsTouched();
    }

    this.horasFormArray.updateValueAndValidity();
  }

  private normalizeAllTimeControls(): void {
    this.horasFormArray.controls.forEach((horaControl, index) => {
      this.normalizeFieldValue(horaControl, 'inicio', index);
      this.normalizeFieldValue(horaControl, 'fin', index);
    });
    this.horasFormArray.updateValueAndValidity();
  }

  private normalizeFieldValue(
    horaControl: AbstractControl,
    field: 'inicio' | 'fin',
    index: number,
  ): void {
    const control = horaControl.get(field);
    if (!control) {
      return;
    }

    const rawInputValue = this.getTimeInputRawValue(index, field);
    const normalized = this.normalizeTimeValue(rawInputValue ?? control.value);
    const normalizedDate = this.coerceTimeControlValue(normalized);
    if (normalizedDate && !this.areDatesEqual(control.value, normalizedDate)) {
      control.setValue(normalizedDate);
      control.markAsDirty();
      control.markAsTouched();
    }
  }

  private normalizeTimeValue(value: unknown): string | null {
    if (value == null) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime())
        ? null
        : this.formatDateAsTime(value);
    }

    const raw = String(value).trim();
    if (!raw) {
      return null;
    }

    if (/^\d{3}$/.test(raw)) {
      const hours = Number(raw.slice(0, 2));
      const minutes = Math.min(Number(raw.slice(2)) * 10, 59);
      if (hours >= 0 && hours <= 23 && minutes >= 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      return raw;
    }

    if (/^\d{4}$/.test(raw)) {
      const hours = Number(raw.slice(0, 2));
      const minutes = Math.min(Number(raw.slice(2)), 59);
      if (hours >= 0 && hours <= 23 && minutes >= 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      return raw;
    }

    // Acepta formatos como "17", "17:", "17:3", "10:--" y los lleva a HH:mm.
    const fallbackMatch = raw.match(/^(\d{1,2}):--$/);
    if (fallbackMatch) {
      const hours = Number(fallbackMatch[1]);
      if (!Number.isNaN(hours) && hours >= 0 && hours <= 23) {
        return `${String(hours).padStart(2, '0')}:00`;
      }
      return raw;
    }

    const match = raw.match(/^(\d{1,2})(?::(\d{0,2}))?$/);
    if (!match) {
      return raw;
    }

    const hours = Number(match[1]);
    if (Number.isNaN(hours) || hours < 0 || hours > 23) {
      return raw;
    }

    const minutesPart = match[2] ?? '';
    const minutes =
      minutesPart === ''
        ? 0
        : minutesPart.length === 1
          ? Math.min(Number(minutesPart) * 10, 59)
          : Math.min(Number(minutesPart), 59);
    if (Number.isNaN(minutes) || minutes < 0) {
      return raw;
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  getTimeInputId(index: number, field: 'inicio' | 'fin'): string {
    return `hora-${field}-${index}`;
  }

  private getTimeInputRawValue(
    index: number,
    field: 'inicio' | 'fin',
  ): string | null {
    const input = document.getElementById(
      this.getTimeInputId(index, field),
    ) as HTMLInputElement | null;
    return input?.value?.trim() || null;
  }

  private getEventInputValue(event?: Event): string | null {
    const target = ((event as any)?.target ??
      (event as any)?.originalEvent?.target) as HTMLInputElement | null;
    return target?.value?.trim() || null;
  }

  private coerceTimeControlValue(value: unknown): Date | null {
    const normalized = this.normalizeTimeValue(value);
    if (!normalized) {
      return null;
    }

    const [hours, minutes] = normalized.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private formatControlTime(value: unknown): string | null {
    const normalized = this.normalizeTimeValue(value);
    return normalized ? normalized : null;
  }

  private formatDateAsTime(value: Date): string {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }

  private areDatesEqual(left: unknown, right: Date): boolean {
    return (
      left instanceof Date &&
      !Number.isNaN(left.getTime()) &&
      left.getHours() === right.getHours() &&
      left.getMinutes() === right.getMinutes()
    );
  }

  addHora() {
    const horaData =
      this.horasFormArray.length === 0 &&
      this.modo === 'A' &&
      this.categoriaSugerida
        ? { categoriaCodigo: this.categoriaSugerida.codigo }
        : undefined;
    this.horasFormArray.push(this.createHoraForm(horaData as any));
  }

  removeHora(index: number) {
    this.horasFormArray.removeAt(index);
    this.horasFormArray.updateValueAndValidity();
  }

  // Validador personalizado para evitar superposición de horarios
  private noOverlapValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const horasArray = control as FormArray;

    if (!horasArray || horasArray.length <= 1) {
      return null;
    }

    const horarios = horasArray.controls
      .map((horaControl, index) => ({
        index,
        inicio: horaControl.get('inicio')?.value,
        fin: horaControl.get('fin')?.value,
      }))
      .filter(
        (h) =>
          this.timeToMinutes(h.inicio) != null &&
          this.timeToMinutes(h.fin) != null,
      );

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

        if (
          inicio1 == null ||
          fin1 == null ||
          inicio2 == null ||
          fin2 == null
        ) {
          continue;
        }

        // Verificar si hay superposición (excluyendo los extremos)
        if (inicio1 < fin2 && fin1 > inicio2) {
          // Marcar error en ambos controles
          horasArray.at(horario1.index).setErrors({ overlap: true });
          horasArray.at(horario2.index).setErrors({ overlap: true });
          return { overlap: true };
        }
      }
    }

    // Limpiar errores de superposición si no hay conflictos
    horasArray.controls.forEach((control) => {
      const errors = control.errors;
      if (errors && errors['overlap']) {
        delete errors['overlap'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    });

    return null;
  }

  private timeToMinutes(time: unknown): number | null {
    const normalized = this.normalizeTimeValue(time);
    if (!normalized) {
      return null;
    }

    const [hours, minutes] = normalized.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Validador para verificar que fin sea mayor que inicio
  private timeRangeValidator(group: AbstractControl): ValidationErrors | null {
    const inicio = group.get('inicio')?.value;
    const fin = group.get('fin')?.value;

    if (!inicio || !fin) {
      return null;
    }

    const inicioTotal = this.timeToMinutes(inicio);
    const finTotal = this.timeToMinutes(fin);

    if (inicioTotal == null || finTotal == null) {
      return null;
    }

    if (finTotal <= inicioTotal) {
      return { invalidTimeRange: true };
    }

    return null;
  }

  modalSelEvento(hora: any, event: Event) {
    event.preventDefault();
    this.modalSel = this.dialogService.open(EventoSelect, {
      ...modalConfig,
      header: 'Seleccionar Evento',
      data: {
        filtroEvento: FiltroActivo.FALSE,
      },
    });

    if (!this.modalSel) return;

    this.modalSel.onClose.subscribe((result: any) => {
      if (!result) return;

      let newHora: any = {
        eventoId: result.id,
      };
      if (result.etapaActualData?.categoriaSugerida) {
        newHora = {
          ...newHora,
          categoriaCodigo: result.etapaActualData.categoriaSugerida.codigo,
        };
      }

      hora.patchValue({
        ...newHora,
      });
    });
  }

  /**
   * Obtiene la categoría sugerida de un evento desde el backend
   * y la aplica a las filas de hora que no tengan categoría asignada.
   */
  private cargarCategoriaSugeridaDeEvento(eventoId: string): void {
    this.eventoService.getByIdCompleto(eventoId).subscribe({
      next: (evento) => {
        if (evento.categoriaSugerida) {
          this.categoriaSugerida = {
            codigo: evento.categoriaSugerida.codigo,
            descripcion: evento.categoriaSugerida.descripcion,
            color: evento.categoriaSugerida.color,
            activo: evento.categoriaSugerida.activo ?? true,
          };

          // Aplicar a todas las filas que no tengan categoría
          this.horasFormArray.controls.forEach((horaControl) => {
            const catControl = horaControl.get('categoriaCodigo');
            if (catControl && !catControl.value) {
              catControl.setValue(this.categoriaSugerida!.codigo);
            }
          });
        }
      },
      error: () => {
        // Silently fail — no es crítico
      },
    });
  }

  private checkAndSetupEditMode() {
    this.dataLoadedCount++;
    if (this.dataLoadedCount === this.totalDataToLoad) {
      // eventoIdPreseleccionado: si tenemos categorías cargadas y evento preseleccionado,
      // auto-aplicar la categoriaSugerida al primer row
      const eventoIdPre = this.config.data?.eventoIdPreseleccionado;
      if (eventoIdPre && this.modo === 'A') {
        this.cargarCategoriaSugeridaDeEvento(eventoIdPre);
      }

      if (this.modo === 'M') {
        this.setupEditMode();
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    }
  }
}
