import { ChangeDetectorRef, Component, inject, Input, OnInit } from "@angular/core";
import { Preferencia, UsuarioCompleto } from "@core/interfaces/usuario";
import { NgIcon } from "@ng-icons/core";
import { NotificationGroup, PREFERENCIAS_GENERALES, PREFERENCIAS_NOTIFICACIONES, PREFERENCIAS_OTROS, PREFERENCIAS_RECORDATORIOS, PreferenceItem, USUARIO_PREFERENCIAS_GRUPOS, getDescripcionUsuarioPref } from "@/app/constants/preferencias_usuario";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from "@core/services/usuario";
import { UiCard } from "@app/components/ui-card";
import { finalize } from 'rxjs';

@Component({
    selector: 'app-tab-preferencias',
    imports: [
        CommonModule,
        UiCard,
        FormsModule
    ],
    template: `

        <div class="small mb-2" [class.text-success]="estadoGuardado === 'guardado'" [class.text-danger]="estadoGuardado === 'error'" role="status">
            @if (estadoGuardado === 'guardando') { Guardando preferencias... }
            @if (estadoGuardado === 'guardado') { Preferencias guardadas. }
            @if (estadoGuardado === 'error') { No se pudieron guardar las preferencias. Intentá nuevamente. }
        </div>
        <app-ui-card title="Notificaciones" titleIcon="lucideBell" helperText="Notificación vía Aplicación">
            <div card-body class="container">
                <div class="row">
                    @for (pref_n of pref_notificaciones; track pref_n.agrupacion) {
                        <div class="col-md card m-2 pt-1">
                            <h5 class="fw-bold ms-1">{{ pref_n.agrupacion }}</h5>
                            @for (noti of pref_n.items; track noti.clave) {
                                
                                <div class="form-check form-check-info form-switch mb-2 ms-3">
                                    <input
                                    type="checkbox"
                                    class="form-check-input"
                                    [id]="'switchInfo' + noti.clave"
                                    [checked]="isPreferenciaActiva(noti)"
                                    (change)="togglePreferencia(noti, $event)"
                                    />
                                    <label class="form-check-label" [for]="'switchInfo' + noti.clave">
                                        &nbsp;&nbsp;{{ noti.descripcion }}
                                    </label>
                                </div>
                            }
                        </div>
                    }
                </div>
            </div>
        </app-ui-card>

        <app-ui-card title="Generales" titleIcon="lucideSettings">
            <div card-body class="d-flex align-items-center flex-wrap">
                @for (pref_g of pref_general; track pref_g.clave) {
                    @switch (pref_g.tipo) {
                        @case ('select') {
                            <div class="me-2">
                                <label for="select{{pref_g.clave}}">{{ pref_g.label }}</label>
                                <select
                                    id="select{{pref_g.clave}}"
                                    class="form-select"
                                    [ngModel]="getPreferenciaValor(pref_g)"
                                    (ngModelChange)="setPreferenciaValor(pref_g, $event)"
                                >
                                    @for (opt of pref_g.opciones; track opt.valor) {
                                        <option value="{{ opt.valor }}">{{ opt.label }}</option>
                                    }
                                </select>
                            </div>
                        }
                        @case ('toggle') {
                            <div class="form-check form-check-info form-switch mb-2 me-2">
                                <label class="form-check-label" [for]="'toggle' + pref_g.clave">
                                    &nbsp;&nbsp;{{ pref_g.label }}
                                </label>
                                <input
                                type="checkbox"
                                class="form-check-input"
                                [id]="'toggle' + pref_g.clave"
                                [checked]="isPreferenciaActiva(pref_g)"
                                (change)="togglePreferencia(pref_g, $event)"
                                />
                            </div>
                        }
                    }
                }
            </div>
        </app-ui-card>

        <app-ui-card title="Recordatorios" titleIcon="lucideMessageCircleWarning" helperText="Recordatorios vía email.">
            <div card-body class="">
                @for (pref_r of pref_recordatorios; track pref_r.clave) {
                    @switch (pref_r.tipo) {
                        @case ('toggle') {
                            <div class="form-check form-check-info form-switch mb-2">
                                <input
                                type="checkbox"
                                class="form-check-input"
                                [id]="pref_r.clave"
                                [checked]="isPreferenciaActiva(pref_r)"
                                (change)="togglePreferencia(pref_r, $event)"
                                />
                                <label class="form-check-label" [for]="pref_r.clave">
                                    &nbsp;&nbsp;{{ pref_r.descripcion }}
                                </label>
                            </div>
                        }
                    }
                }
            </div>
        </app-ui-card>

        <app-ui-card title="Otros" titleIcon="lucideShell">
            <div card-body class="">
                @for (pref_o of pref_otros; track pref_o.clave) {
                    @switch (pref_o.tipo) {
                        @case ('toggle') {
                            <div class="form-check form-check-info form-switch mb-2">
                                <input
                                type="checkbox"
                                class="form-check-input"
                                [id]="pref_o.clave"
                                [checked]="isPreferenciaActiva(pref_o)"
                                (change)="togglePreferencia(pref_o, $event)"
                                />
                                <label class="form-check-label" [for]="pref_o.clave">
                                    &nbsp;&nbsp;{{ pref_o.descripcion }}
                                </label>
                            </div>
                        }
                    }
                }
            </div>
        </app-ui-card>
    `,
})
export class TabPreferencias implements OnInit {
    private cdr = inject(ChangeDetectorRef);
    private usuarioService = inject(UsuarioService);
    @Input() usuario!: UsuarioCompleto;

    grupos:any = USUARIO_PREFERENCIAS_GRUPOS;
    pref_notificaciones:NotificationGroup[] = PREFERENCIAS_NOTIFICACIONES;
    pref_general:PreferenceItem[] = PREFERENCIAS_GENERALES;
    pref_otros:PreferenceItem[] = PREFERENCIAS_OTROS;
    pref_recordatorios:PreferenceItem[] = PREFERENCIAS_RECORDATORIOS;
    estadoGuardado: 'idle' | 'guardando' | 'guardado' | 'error' = 'idle';
    private preferenciasGuardadas: Preferencia[] = [];
    private preferenciasPendientes: Preferencia[] | null = null;
    private guardandoPreferencias = false;

    ngOnInit(): void {
        this.preferenciasGuardadas = this.copiarPreferencias();
    }

    isPreferenciaActiva(pref: any): boolean {
        if (!this.usuario || !this.usuario.preferencias) return false;
        return this.usuario.preferencias.some((p: any) => p.clave === pref.clave);
    }

    togglePreferencia(pref: any, event: any) {
        if (!this.usuario) return;
        if (!this.usuario.preferencias) this.usuario.preferencias = [];
        const checked = event.target.checked;
        if (checked) {
            if (!this.usuario.preferencias.some((p: any) => p.clave === pref.clave)) {
                this.usuario.preferencias.push({ usuarioId: this.usuario.id!, clave: pref.clave, descripcion: '' /*pref.descripcion */ });
            }
        } else {
            this.usuario.preferencias = this.usuario.preferencias.filter((p: any) => p.clave !== pref.clave);
        }
        this.guardarPreferencias();
    }

    setPreferenciaValor(pref: any, valor: string) {
        if (!this.usuario) return;
        if (!this.usuario.preferencias) this.usuario.preferencias = [];
        const existingPrefIndex = this.usuario.preferencias.findIndex((p: any) => p.clave === pref.clave);
        if (existingPrefIndex !== -1) {
            this.usuario.preferencias[existingPrefIndex].descripcion = valor;
        } else {
            this.usuario.preferencias.push({ usuarioId: this.usuario.id!, clave: pref.clave, descripcion: valor });
        }
        this.guardarPreferencias();
    }

    private copiarPreferencias(): Preferencia[] {
        return (this.usuario?.preferencias ?? []).map(pref => ({ ...pref }));
    }

    private guardarPreferencias(): void {
        if (!this.usuario?.id) return;
        const preferencias = this.copiarPreferencias();
        if (this.guardandoPreferencias) {
            this.preferenciasPendientes = preferencias;
            return;
        }
        this.guardandoPreferencias = true;
        this.estadoGuardado = 'guardando';
        this.usuarioService.setPreferencias(this.usuario.id, preferencias).pipe(
            finalize(() => {
                this.guardandoPreferencias = false;
                const pendientes = this.preferenciasPendientes;
                this.preferenciasPendientes = null;
                if (pendientes) this.guardarPreferencias();
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (guardadas) => {
                this.preferenciasGuardadas = guardadas.map(pref => ({ ...pref }));
                this.estadoGuardado = 'guardado';
            },
            error: () => {
                if (!this.preferenciasPendientes && this.usuario) {
                    this.usuario.preferencias = this.preferenciasGuardadas.map(pref => ({ ...pref }));
                }
                this.estadoGuardado = 'error';
            }
        });
    }

    getPreferenciaValor(pref: any): string {
        if (!this.usuario || !this.usuario.preferencias) return '';
        const foundPref = this.usuario.preferencias.find((p: any) => p.clave === pref.clave);
        return foundPref ? foundPref.descripcion : '';
    }

}
