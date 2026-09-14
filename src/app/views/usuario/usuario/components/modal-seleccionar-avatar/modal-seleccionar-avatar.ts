import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AVATAR_OPTIONS, AVATAR_STRATEGIES, AvatarStrategy, getAvatarImage, getAvatarStrategy } from '@/app/constants/avatares-disponibles';
import { Usuario } from '@core/interfaces/usuario';

@Component({
    selector: 'app-modal-seleccionar-avatar',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule],
    template: `
        <p-dialog 
            [(visible)]="visible" 
            [modal]="true" 
            [style]="{width: '600px'}"
            header="Seleccionar foto de perfil"
            (onHide)="onClose()">
            <div class="row g-3">
                @for (opcion of opciones; track opcion.strategy) {
                    <div class="col-3">
                        <div class="text-center">
                            <img 
                                [src]="getPreview(opcion.strategy)"
                                class="rounded-circle cursor-pointer border"
                                [class.border-primary]="imagenSeleccionada === opcion.strategy"
                                [class.border-3]="imagenSeleccionada === opcion.strategy"
                                width="120"
                                height="120"
                                (click)="seleccionarImagen(opcion.strategy)"
                                [alt]="opcion.label">
                        </div>
                    </div>
                }
            </div>
            <ng-template pTemplate="footer">
                <button 
                    pButton 
                    label="Cancelar" 
                    icon="pi pi-times" 
                    class="p-button-text"
                    (click)="onClose()"></button>
                <button 
                    pButton 
                    label="Guardar" 
                    icon="pi pi-check"
                    [disabled]="!imagenSeleccionada"
                    (click)="onGuardar()"></button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        .cursor-pointer {
            cursor: pointer;
            transition: transform 0.2s;
        }
        .cursor-pointer:hover {
            transform: scale(1.1);
        }
    `]
})
export class ModalSeleccionarAvatarComponent implements OnChanges {
    @Input() visible: boolean = false;
    @Input() imagenActual: string = AVATAR_STRATEGIES.ID;
    @Input() usuario!: Usuario;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() imagenCambiada = new EventEmitter<AvatarStrategy>();

    imagenSeleccionada: AvatarStrategy = AVATAR_STRATEGIES.ID;
    opciones = AVATAR_OPTIONS;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['imagenActual'] || changes['visible']) {
            this.imagenSeleccionada = getAvatarStrategy(this.imagenActual);
        }
    }

    getPreview(strategy: AvatarStrategy): string {
        return getAvatarImage(strategy, this.usuario ?? {});
    }

    seleccionarImagen(strategy: AvatarStrategy): void {
        this.imagenSeleccionada = strategy;
    }

    onGuardar() {
        this.imagenCambiada.emit(this.imagenSeleccionada);
        this.onClose();
    }

    onClose() {
        this.visible = false;
        this.visibleChange.emit(false);
    }
}
