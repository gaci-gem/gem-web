import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ComparativaHorasMes } from '@core/interfaces/registro-hora';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Observable, finalize } from 'rxjs';

@Component({
  standalone: true,
  imports: [TableModule, SelectModule, FormsModule],
  template: `
    <div class="flex align-items-center gap-2 mb-3">
      <label for="anio-comparativa">Año</label>
      <p-select inputId="anio-comparativa" [options]="anios" [(ngModel)]="anioSeleccionado" optionLabel="label" optionValue="value" (onChange)="cambiarAnio()" />
    </div>
    @if (cargando) {
      <p> Cargando comparativa...</p>
    } @else {
    <p-table [value]="meses" size="small" [tableStyle]="{ 'min-width': '35rem' }">
      <ng-template #header><tr><th>Mes</th><th>Horas cargadas</th><th>Días con carga</th><th>Usuarios activos</th></tr></ng-template>
      <ng-template #body let-mes><tr><td class="text-capitalize">{{ mes.mes }}</td><td>{{ mes.totalHorasFormateadas }}</td><td>{{ mes.diasConCarga }}</td><td>{{ mes.usuariosActivos }}</td></tr></ng-template>
    </p-table>
    }
  `
})
export class CompararMesesModal {
  private config = inject(DynamicDialogConfig);
  private cdr = inject(ChangeDetectorRef);
  meses: ComparativaHorasMes[] = this.config.data?.meses ?? [];
  anioSeleccionado = this.config.data?.anio ?? new Date().getFullYear();
  anios = Array.from({ length: 11 }, (_, indice) => {
    const value = new Date().getFullYear() - 5 + indice;
    return { label: String(value), value };
  });
  cargando = false;

  ngOnInit(): void {
    this.cargarAnio();
  }

  cambiarAnio(): void {
    this.cargarAnio();
  }

  private cargarAnio(): void {
    const cargarComparativa = this.config.data?.cargarComparativa as ((anio: number) => Observable<ComparativaHorasMes[]>) | undefined;
    if (!cargarComparativa) return;
    this.cargando = true;
    cargarComparativa(this.anioSeleccionado).pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: meses => {
        this.meses = meses;
        this.cdr.detectChanges();
      },
      error: () => {
        this.meses = [];
        this.cdr.detectChanges();
      }
    });
  }
}
