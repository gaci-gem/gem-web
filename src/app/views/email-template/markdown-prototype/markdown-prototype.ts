import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmailTemplateService } from '@core/services/email-templates';
import { EmailTemplateCatalogItem, EmailTemplateVariable, EmailTemplateBloqueMarkdown } from '@core/interfaces/email-template';

export const MARKDOWN_PROTOTYPE_BASES: Readonly<Record<string, string>> = {
    'aviso-falta-carga': 'Hola {{nombre}},\n\n# Recordatorio de carga horaria\n\nNo registraste tus horas laborales en los últimos {{diasSinRegistro}} días.\n\n:::boton url="{{gem_url}}" align="center"\nIngresá tus horas\n:::',
    'evento-asignado': 'Hola {{nombre}},\n\n# {{tituloEvento}}\n\n:::destacado tipo="info"\n**Importante:** revisá los datos del evento.\n:::\n\n:::datos titulo="Resumen de {{tituloEvento}}"\n- Prioridad: {{prioridadTxt}}\n- Fecha: {{fechaEvento}}\n:::\n\n:::boton url="{{urlEvento}}" align="center" width="220px"\nVer evento\n:::',
    'gem-clientes-credential': 'Hola,\n\n# Credenciales de acceso\n\n:::datos\n- Usuario: {{login}}\n- Clave temporal: {{password}}\n:::\n\nIngresá al portal {{portalUrl}} y cambiá la contraseña temporal.',
    'gem-clientes-ticket-notification': 'Hola,\n\n# Actualización del ticket #{{ticketId}}\n\nEl ticket "{{subject}}" cambió de estado: {{previousStatus}} → {{newStatus}}.\n\nComentario: {{comment}}',
    'inbound-ticket-confirmation': 'Hola {{nombre}},\n\n# Ticket recibido: {{subject}}\n\n:::datos\n- Estado: Recibido\n- Asunto: {{subject}}\n- Detalle: {{detalle}}\n:::\n\nPodés consultar el estado desde el Portal Cliente.',
    'novedad-creada': 'Hola {{nombre}},\n\n# {{titulo}}\n\nTipo: {{tipo}}\n\n{{contenido}}',
    recupero: '# Recuperación de contraseña\n\nHola,\n\nUsá el siguiente código para recuperar tu contraseña:\n\n:::codigo variable="{{codigoRecupero}}"\n:::\n\nSi no solicitaste este cambio, podés ignorar este correo.',
    'reporte-solicitado': 'Hola {{nombre}},\n\n# Reporte generado\n\nEl reporte de tipo {{tipo}} fue solicitado el {{fechaSolicitado}} y se generó correctamente.\n\nEl archivo también fue adjuntado a este correo.',
};

export const MARKDOWN_BLOCK_HELP: Readonly<Record<EmailTemplateBloqueMarkdown, string>> = {
  titulo: '# Título o ## subtítulo',
  inline: '**negrita**, _cursiva_',
  datos: ':::datos\n- Etiqueta: valor\n:::',
  boton: ':::boton url="{{variable URL}}"\nTexto\n:::',
  codigo: ':::codigo variable="{{variable}}"\n:::',
  destacado: ':::destacado tipo="info"\nTexto\n:::',
  lista: '- Primer elemento\n- Segundo elemento',
  separador: ':::separador\n:::',
  enlace: '[texto](variable URL)',
  nota: ':::nota\nTexto secundario\n:::',
};

export function construirCampos(campos: string[]): string[] {
  return ['asunto', ...campos.filter(campo => campo !== 'asunto')];
}

export function clasificarVariable(variable: EmailTemplateVariable): 'texto' | 'url' {
  if (variable.tipo) return variable.tipo;
  const token = variable.token.replace(/[{}]/g, '').trim();
  return /(?:url|portal|link|enlace|href)/i.test(token) ? 'url' : 'texto';
}

@Component({ selector: 'app-markdown-prototype', standalone: true, imports: [CommonModule, ReactiveFormsModule], templateUrl: './markdown-prototype.html' })
export class MarkdownPrototype {
  private readonly service = inject(EmailTemplateService); private readonly sanitizer = inject(DomSanitizer); private readonly route = inject(ActivatedRoute); private readonly destroyRef = inject(DestroyRef);
  clave = 'evento-asignado'; templates: EmailTemplateCatalogItem[] = []; template: EmailTemplateCatalogItem | null = null; variables: EmailTemplateVariable[] = []; preview: SafeHtml | null = null; cargando = false; errorPreview: string | null = null;
  readonly MARKDOWN_BLOCK_HELP = MARKDOWN_BLOCK_HELP;
  markdown = new FormControl(MARKDOWN_PROTOTYPE_BASES['evento-asignado'], { nonNullable: true });
  constructor() { this.service.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(templates => { this.templates = templates; this.seleccionar(this.clave); }); this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => { const clave = params.get('clave'); if (clave) this.seleccionar(clave); }); this.markdown.valueChanges.pipe(debounceTime(350), distinctUntilChanged(), switchMap(value => { this.cargando = true; this.errorPreview = null; return this.service.previewMarkdown(this.clave, value).pipe(catchError(() => { this.marcarErrorPreview(); return EMPTY; })); }), takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => { this.preview = this.sanitizer.bypassSecurityTrustHtml(result.html); this.errorPreview = null; this.cargando = false; } }); }
  seleccionar(clave: string): void { const template = this.templates.find(item => item.clave === clave); if (!template && this.templates.length) return; this.clave = clave; this.template = template ?? null; this.variables = template?.variables ?? []; this.markdown.setValue(MARKDOWN_PROTOTYPE_BASES[clave] ?? '', { emitEvent: false }); this.preview = null; this.errorPreview = null; this.solicitarPreview(); }
  solicitarPreview(): void { this.cargando = true; this.errorPreview = null; this.service.previewMarkdown(this.clave, this.markdown.value).pipe(catchError(() => { this.marcarErrorPreview(); return EMPTY; }), takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => { this.preview = this.sanitizer.bypassSecurityTrustHtml(result.html); this.errorPreview = null; this.cargando = false; } }); }
  private marcarErrorPreview(): void { this.preview = null; this.cargando = false; this.errorPreview = 'No se pudo generar el preview. Revisá el contenido e intentá nuevamente.'; }
  bloques(): EmailTemplateBloqueMarkdown[] { return ['titulo', 'inline', 'datos', 'boton', 'codigo', 'destacado', 'lista', 'separador', 'enlace']; }
  variablesPorTipo(tipo: 'texto' | 'url'): EmailTemplateVariable[] { return this.variables.filter(variable => clasificarVariable(variable) === tipo); }
  insertarBloque(bloque: EmailTemplateBloqueMarkdown): void {
    const url = this.variablesPorTipo('url')[0]?.token;
    if (bloque === 'boton' && !url) return;
    const value = bloque === 'boton' ? `:::boton url="${url}" align="center"\nVer detalle\n:::` : MARKDOWN_BLOCK_HELP[bloque];
    this.insertar(value.replace('{{variable URL}}', url ?? '{{variable}}'));
  }
  insertar(value: string): void { this.markdown.setValue(`${this.markdown.value}${this.markdown.value ? '\n\n' : ''}${value}`); }
}
