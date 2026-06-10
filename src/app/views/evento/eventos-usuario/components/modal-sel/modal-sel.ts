import { createTypeaheadFormatter, createTypeaheadSearch } from '@/app/utils/typeahead-utils';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Requisito } from '@core/interfaces/evento';
import { Usuario } from '@core/interfaces/usuario';
import { UsuarioService } from '@core/services/usuario';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { NgIcon } from '@ng-icons/core';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { forkJoin, of, tap } from 'rxjs';
import { EventoService } from '@core/services/evento';
import { catchError, finalize } from 'rxjs/operators';
import { MentionOption, MentionTextareaComponent } from '@app/components/index';

@Component({
  selector: 'app-modal-sel',
  imports: [
    FormsModule,
    ToastModule,
    NgIcon,
    NgbTypeaheadModule,
    SelectModule,
    TableModule,
    MentionTextareaComponent,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './modal-sel.html',
  styleUrls: ['./modal-sel.scss']
})
export class ModalSel implements OnInit{
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  private usuarioService = inject(UsuarioService);
  private eventoService = inject(EventoService);

  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);

  usuarios: Usuario[] = [];
  usuario!:Usuario;

  reqComentario: boolean = false;
  comentario: string = '';
  usuarioOptions: MentionOption[] = [];

  mensaje: string = '';
  modo: string = '';
  rol: string = '';

  etapaActual: string = '';
  requisitos: Requisito[] = [];
  requisitosValores: { [key: number]: any } = {};
  proximaEtapa: string = '';
  eventoId: string = '';
  usuarioId: string = '';

  ngOnInit(): void {
    // lectura segura de config
    const data = this.config?.data ?? {};
    this.reqComentario = !!data.reqComentario;
    this.comentario = data.comentario ?? '';
    this.mensaje = data.mensaje ?? '';
    this.modo = data.modo ?? '';
    this.etapaActual = data.etapaActual ?? '';
    this.requisitos = data.requisitos ?? [];
    this.proximaEtapa = data.proximaEtapa ?? '';
    this.eventoId = data.eventoId ?? '';
    this.usuarioId = data.usuarioId ?? '';
    
    // Inicializar valores de requisitos
    this.requisitos.forEach(req => {
      this.requisitosValores[req.id] = '';
    });

    
    this.usuarioService.getAll().pipe(
      finalize(() => {
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (usuarios) => {
        this.usuarioOptions = usuarios.map((u) => ({
          id: u.id ?? u.usuario,
          label: `${u.nombre} ${u.apellido}`,
          value: u.usuario,
          sublabel: u.usuario,
          color: u.color,
        }));
      },
    });

    this.rol = data.rol;
    if (this.rol) {
      this.usuarioService.getByRol(this.rol).pipe(
        // tap((res: any) => console.log('getByRol', res))
      ).subscribe({
        next: (res: any) => {
          // console.log(res)
          this.usuarios = res || [];
          // si no hay resultados para el rol, cargar todos
          if (!this.usuarios.length) {
            this.cargarTodos();
          } else {
            this.usuarios = res || [];
            this.searchUsuario = createTypeaheadSearch(this.usuarios, u => `${u.usuario} | ${u.nombre} ${u.apellido}`);
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.cargarTodos();
        }
      });
    } else {
      this.cargarTodos();
    }
  }

  private cargarTodos(){
    // console.log(this.rol)
    this.usuarioService.getByRol(this.rol).pipe(
      // tap((res: any) => console.log('getAll', res))
    ).subscribe({
      next: (res: any) => {
        this.usuarios = res || [];
        this.searchUsuario = createTypeaheadSearch(this.usuarios, u => `${u.usuario} | ${u.nombre} ${u.apellido}`);
        // this.checkAndSetupEditMode();
      }
    });
  }

  seleccionar($event:any){
    // validar usuario cuando corresponde
    if (this.modo !== 'REC' && (this.usuario === null || this.usuario === undefined)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Debe seleccionar un usuario.'
      });
      return;
    }

    if (this.reqComentario && !this.comentario) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El comentario es requerido.'
      });
      return;
    }

    // Validar que los requisitos obligatorios tengan valor
    const requisitosObligatoriosIncumplidos = this.requisitos.filter(
      req => req.obligatorio && (!this.requisitosValores[req.id] || this.requisitosValores[req.id].toString().trim() === '')
    );

    if (requisitosObligatoriosIncumplidos.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Requisitos obligatorios',
        detail: 'Debe completar todos los requisitos obligatorios antes de continuar.'
      });
      return;
    }

    // Obtener requisitos con valor
    const requisitosConValor = Object.keys(this.requisitosValores)
      .filter(key => this.requisitosValores[+key] && this.requisitosValores[+key].toString().trim() !== '')
      .map(key => ({
        requisitoId: +key,
        valor: this.requisitosValores[+key]
      }));

    if (requisitosConValor.length > 0 && this.eventoId) {
      this.registrarRequisitos(requisitosConValor);
    } else {
      this.cerrar({
        usuarioSeleccionado: (this.usuario) ? this.usuario.id : '',
        comentario: this.comentario,
      });
    }
  }

  private registrarRequisitos(requisitosData: { requisitoId: number, valor: any }[]): void {
    const requests = requisitosData.map(data => {
      const requisito = this.requisitos.find(r => r.id === data.requisitoId);
      const dto: any = {
        eventoId: this.eventoId,
        requisitoId: data.requisitoId,
        usuarioId: this.usuarioId
      };

      // Mapear el valor al campo correcto según el tipo
      const tipoLower = requisito?.tipo?.toLowerCase();
      switch (tipoLower) {
        case 'text':
          dto.valorTexto = data.valor;
          break;
        case 'numeric':
          dto.valorNumero = Number(data.valor);
          break;
        case 'date':
          dto.valorFecha = data.valor;
          break;
        case 'boolean':
          dto.valorBooleano = Boolean(data.valor);
          break;
        case 'file':
          dto.url = data.valor;
          break;
        default:
          dto.valorTexto = data.valor;
      }

      return this.eventoService.registrarEventoRequisito(this.eventoId, dto).pipe(
        catchError(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error al registrar requisito "${requisito?.descripcion}": ${error?.error?.message || 'Error desconocido'}`
          });
          return of(null);
        })
      );
    });

    forkJoin(requests).subscribe({
      next: (results) => {
        const exitosos = results.filter(r => r !== null).length;
        const errores = results.filter(r => r === null).length;
        
        if (errores === 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Requisitos registrados',
            detail: `${requisitosData.length} requisito(s) registrado(s) correctamente.`
          });
          
          // Solo cerrar si no hay errores
          this.cerrar({
            usuarioSeleccionado: (this.usuario) ? this.usuario.id : '',
            comentario: this.comentario,
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Registro parcial',
            detail: `${exitosos} requisito(s) registrado(s), ${errores} con error(es). Corrija los errores y vuelva a intentar.`
          });
          // NO cerrar el modal para que el usuario pueda corregir
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al registrar los requisitos.'
        });
        // NO cerrar el modal
      }
    });
  }

  cerrar(res:any){
    this.ref.close(res);
  }
  
  get mensajeHtml(): string {
    return this.mensaje ? this.mensaje.replace(/\n/g, '<br>') : '';
  }

  searchUsuario = createTypeaheadSearch<Usuario>(
    this.usuarios,
    item => `${item.usuario} | ${item.nombre} ${item.apellido}`,
  );
  formatterUsuario = createTypeaheadFormatter<Usuario>(
    item => `${item.usuario} | ${item.nombre} ${item.apellido}`,
  );

  getInputType(tipo: string): string {
    const tipoLower = tipo?.toLowerCase();
    switch (tipoLower) {
      case 'numeric':
        return 'number';
      case 'text':
        return 'text';
      case 'date':
        return 'date';
      case 'file':
        return 'file';
      default:
        return 'text';
    }
  }

  getPlaceholder(requisito: Requisito): string {
    const tipoLower = requisito.tipo?.toLowerCase();
    switch (tipoLower) {
      case 'numeric':
        return 'Valor numérico';
      case 'date':
        return '';
      case 'file':
        return 'Seleccione archivo';
      default:
        return `Ingrese ${requisito.descripcion.toLowerCase()}`;
    }
  }
}