import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { UsuarioService } from '../../../core/services/usuario';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UiCard } from '../../../components/ui-card';
import { UserStorageService } from '@core/services/user-storage';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NgIcon } from '@ng-icons/core';
import { EventoCompleto } from '@core/interfaces/evento';
import { UsuarioCompleto } from '@core/interfaces/usuario';
import { LoadingSpinnerComponent } from '@app/components/index';
import { ReactiveFormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TabPerfil } from './components/tab-perfil';
import { TabModificar } from './components/tab-modificar';
import { TabSeguridad } from './components/tab-seguridad';
import { TabPreferencias } from './components/tab-preferencias';
import { TabIntegraciones } from './components/tab-integraciones';
import { AvatarEditableComponent } from '@app/components/avatar-editable';
import { ModalSeleccionarAvatarComponent } from './components/modal-seleccionar-avatar/modal-seleccionar-avatar';
import { UsuarioAdicionalClave } from '@/app/constants/adicionales_usuario';
import { AVATAR_POR_DEFECTO, getAvatarPath } from '@/app/constants/avatares-disponibles';
import { AvatarSyncService } from '@core/services/avatar-sync.service';
import { getDiscordUserUrl } from '@/app/constants/social-urls';

@Component({
    selector: 'app-usuario',
    standalone: true,
    imports: [
        CommonModule,
        NgbNavModule, 
        UiCard, 
        NgIcon,
        LoadingSpinnerComponent,
        ReactiveFormsModule,
        ConfirmDialogModule,
        ToastModule,
        TabPerfil,
        TabModificar,
        TabPreferencias,
        TabSeguridad,
        TabIntegraciones,
        AvatarEditableComponent,
        ModalSeleccionarAvatarComponent,
    ],
    providers: [
        MessageService,
        ConfirmationService
    ],
    templateUrl: './usuario.html',
})
export class Usuario implements OnInit {
    @Input() usuarioIdParam!: string;
    @Input() esMitadPantalla: boolean = false;

    private usuarioService = inject(UsuarioService);
    private rutActiva = inject(ActivatedRoute);
    private router = inject(Router);
    private userStorageService = inject(UserStorageService);
    private cdr = inject(ChangeDetectorRef);
    protected messageService = inject(MessageService);
    protected confirmationService = inject(ConfirmationService);
    private avatarSyncService = inject(AvatarSyncService);

    usuario!:UsuarioCompleto;
    eventosActuales!: EventoCompleto[];
    rolesUsuario: string[] = [];
    cargandoUsuario: boolean = false;

    activeTab:number = 1;
    esPropioPerfil: boolean = false;
    mostrarModalAvatar: boolean = false;

    ngOnInit() {
        const routeId = this.rutActiva.snapshot.paramMap.get('id');
        const storedUser = this.userStorageService.getUsuario();

        // Si no hay id en la ruta y es el propio usuario, navegar a la ruta con su id
        if (!this.usuarioIdParam) {
            if (!routeId && storedUser && storedUser.id) {
                // Navegar a ruta absoluta /usuario/perfil/:id para evitar 404
                this.router.navigate(['/usuario/perfil', storedUser.id]).then(() => {
                    this.cargarUsuario(storedUser.id!);
                }).catch(() => {
                    this.cargarUsuario(storedUser.id!);
                });
                return;
            }
        }

        const userId = this.getUsuarioId();
        if (userId) {
            this.cargarUsuario(userId);
        }
    }

    private getUsuarioId(): string | null {
        if (this.usuarioIdParam) return this.usuarioIdParam;
        const idFromRoute = this.rutActiva.snapshot.paramMap.get('id');
        if (idFromRoute) return idFromRoute;
        const storedUser = this.userStorageService.getUsuario();
        return storedUser && storedUser.id ? storedUser.id : null;
    }

    cargarUsuario(userId: string): void {
        this.cargandoUsuario = true;
        this.usuarioService.getByIdCompleto(userId).subscribe({
            next: (usuario: any) => this.onUsuarioCargado(usuario),
            error: (err: any) => this.showError("Error",err),
            complete: () => {
                this.cargandoUsuario = false;
                this.cdr.detectChanges();
            }
        });
    }

    private onUsuarioCargado(usuario: any): void {
        // console.log(usuario);
        this.usuario = usuario;
        this.eventosActuales = usuario.eventosActuales || [];
        this.rolesUsuario = usuario.roles ? usuario.roles.map((rol:any) => rol.rolCodigo) : [];
        this.esPropioPerfil = this.userStorageService.getUsuario()?.id === usuario.id;

        this.cdr.detectChanges();
    }

    protected showSuccess(summary: string, detail: string) {
        this.messageService.add({ severity: 'success', summary, detail });
    }

    protected showError(summary: string, detail: string) {
        this.messageService.add({ severity: 'error', summary, detail });
    }

    getUrlDiscord(): string | null {
        if (!this.usuario?.adicionales) return null;
        const adicionalDiscord = this.usuario.adicionales.find(
            adicional => adicional.clave === UsuarioAdicionalClave.URL_DISCORD
        );
        return adicionalDiscord && adicionalDiscord.valor 
            ? getDiscordUserUrl(adicionalDiscord.valor) 
            : null;
    }

    getFotoPerfil(): string {
        if (!this.usuario?.adicionales) return getAvatarPath(AVATAR_POR_DEFECTO);
        const adicionalFoto = this.usuario.adicionales.find(
            adicional => adicional.clave === UsuarioAdicionalClave.FOTO_PERFIL
        );
        return adicionalFoto 
            ? getAvatarPath(adicionalFoto.valor)
            : getAvatarPath(AVATAR_POR_DEFECTO);
    }

    getNombreFotoPerfil(): string {
        if (!this.usuario?.adicionales) return AVATAR_POR_DEFECTO;
        const adicionalFoto = this.usuario.adicionales.find(
            adicional => adicional.clave === UsuarioAdicionalClave.FOTO_PERFIL
        );
        return adicionalFoto ? adicionalFoto.valor : AVATAR_POR_DEFECTO;
    }

    abrirModalAvatar(): void {
        if (this.esPropioPerfil) {
            this.mostrarModalAvatar = true;
        }
    }

    cambiarFotoPerfil(nombreImagen: string): void {
        this.usuarioService.actualizarAdicional(this.usuario.id!, UsuarioAdicionalClave.FOTO_PERFIL, nombreImagen).subscribe({
            next: () => {
                this.showSuccess('Foto actualizada', 'La foto de perfil se actualizó correctamente');
                this.avatarSyncService.notificarCambioAvatar(nombreImagen);
                this.cargarUsuario(this.usuario.id!);
            },
            error: (err) => this.showError('Error', 'No se pudo actualizar la foto')
        });
    }
}
