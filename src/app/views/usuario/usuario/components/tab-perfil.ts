import { ChangeDetectorRef, Component, inject, Input, OnInit } from "@angular/core";
import { BadgeClickComponent } from "@app/components/badge-click";
import { DrawerService } from "@core/services/drawer.service";
import { UiCard } from "@app/components/ui-card";
import { EventoCompleto } from "@core/interfaces/evento";
import { PadZeroPipe } from "@core/pipes/pad-zero.pipe";
import { TableModule } from "primeng/table";
import { RolService } from "@core/services/rol";
import { Rol } from "@core/interfaces/rol";
import { getColor } from "@/app/utils/color-utils";
import { finalize } from "rxjs";

@Component({
    selector: 'app-tab-perfil',
    imports: [
        UiCard,
        BadgeClickComponent,
        PadZeroPipe,
        TableModule,
    ],
    template: `
        @if (eventosActuales) {
            <app-ui-card title="Roles" [isTogglable]="true" [initialCollapsed]="false">
                <div card-body class="d-flex">
                    @for (rol of rolesCompletos; track rol.codigo) {
                        <div class="rol-item mx-1">
                            <app-badge-click
                                [backgroundColor]="rol.color ?? primaryColor"
                                width="auto"
                            >
                                {{ rol.codigo }} - {{ rol.descripcion }}
                            </app-badge-click>
                        </div>
                    }
                </div>
            </app-ui-card>
            <app-ui-card title="Eventos" [isTogglable]="true" [initialCollapsed]="false">
                <div card-body>
                    <p-table [value]="eventosActuales" size="small">
                        <ng-template #header>
                            <tr>
                                <th hidden>Id</th>
                                <th hidden>Tipo</th>
                                <th hidden>Numero</th>
                                <th>Evento</th>
                                <th>Titulo</th>
                                <th>Producto</th>
                                <th>Cliente</th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-evento>
                            <tr>
                                <td hidden>{{ evento.id }}</td>
                                <td hidden>{{ evento.tipo.id }}</td>
                                <td hidden>{{ evento.numero }}</td>
                                <td>
                                    <app-badge-click 
                                        [backgroundColor]="evento.tipo.color ?? primaryColor"
                                        (click)="abrirEventoDrawer(evento)"
                                        style="cursor:pointer"
                                    >
                                        {{ evento.tipo.codigo }}-{{evento.numero | padZero:3}}
                                    </app-badge-click>
                                </td>
                                <td>{{ evento.titulo }}</td>
                                <td>{{ evento?.cliente ? evento.cliente?.sigla + " - " + evento.cliente?.nombre : "-" }} </td>
                                <td>{{ evento?.producto ? evento.producto.sigla + " - " + evento.producto.nombre + " | " + evento.producto.entornoCodigo : "-" }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </app-ui-card>
        }
    `,
})
export class TabPerfil implements OnInit {
    @Input() usuarioId!: string;
    @Input() rolesUsuario: string[] = [];
    @Input() eventosActuales: EventoCompleto[] = [];

    private drawerService = inject(DrawerService);
    private rolService = inject(RolService);
    private ctr = inject(ChangeDetectorRef);

    rolesCompletos: Rol[] = [];
    primaryColor: string = getColor('primary');
    
    ngOnInit(): void {
        this.completarRoles();
    }

    completarRoles() {
        this.rolesCompletos = [];
        this.rolesUsuario.forEach(rolCodigo => {
            this.rolService.getByCodigo(rolCodigo)
            .pipe(
                finalize(() => {
                    this.rolesCompletos.sort((a, b) => a.codigo.localeCompare(b.codigo));
                    this.ctr.detectChanges();
                })
            )
            .subscribe({
                next: (rol: Rol) => {
                    this.rolesCompletos.push(rol);
                },
                error: (err: any) => {
                    console.error(`Error al obtener el rol con código ${rolCodigo}:`, err);
                }
            });
        });
    }

    trackByCodigo(index: number, rol: Rol) {
        return rol?.codigo ?? index;
    }


    abrirEventoDrawer(evento: EventoCompleto) {
        if (evento.id) {
            this.drawerService.abrirEventoDrawer(evento.id);
        }
    }

}
