import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UiCard } from '@app/components/ui-card';
import { EmailTemplateBloqueMarkdown, EmailTemplatePreview, EmailTemplateVariable } from '@core/interfaces/email-template';
import { EmailTemplateService } from '@core/services/email-templates';
import { LoadingService } from '@core/services/loading.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

export function construirCampos(campos: string[]): string[] {
  return ['asunto', ...campos.filter((campo, index) => campo !== 'asunto' && campos.indexOf(campo) === index)];
}

@Component({ selector: 'app-email-template-editor', standalone: true, imports: [CommonModule, ReactiveFormsModule, ToastModule, UiCard, DialogModule, InputTextModule, ButtonModule], providers: [MessageService], templateUrl: './email-template-editor.html', styleUrl: './email-template-editor.scss' })
export class EmailTemplateEditor implements OnInit {
  @ViewChild('markdownEditor') private markdownEditor?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('previewFrame') private previewFrame?: ElementRef<HTMLIFrameElement>;
   private readonly service = inject(EmailTemplateService); private readonly loading = inject(LoadingService); private readonly messages = inject(MessageService); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly destroyRef = inject(DestroyRef); private readonly sanitizer = inject(DomSanitizer); private readonly cdr = inject(ChangeDetectorRef);
  variables: EmailTemplateVariable[] = []; bloquesMarkdown: EmailTemplateBloqueMarkdown[] = []; ayuda = ''; clave = ''; previewData: EmailTemplatePreview | null = null; previewHtml: SafeHtml | null = null; cargando = true; guardando = false; previsualizando = false; pruebaVisible = false; enviandoPrueba = false;
  readonly ejemplosMarkdown: Readonly<Record<EmailTemplateBloqueMarkdown, { sintaxis: string; resultado: string }>> = {
    titulo: { sintaxis: '# Título', resultado: 'Título' },
    inline: { sintaxis: '**negrita** y _cursiva_', resultado: 'negrita y cursiva' },
    datos: { sintaxis: ':::datos\n- Estado: {{estado}}\n:::', resultado: 'Estado  |  Aprobado' },
    boton: { sintaxis: ':::boton url="{{url}}"\nVer detalle\n:::', resultado: 'Ver detalle' },
    codigo: { sintaxis: ':::codigo variable="{{codigo}}"\n:::', resultado: '482913' },
    destacado: { sintaxis: ':::destacado tipo="info"\nAviso\n:::', resultado: 'Aviso informativo' },
    nota: { sintaxis: ':::nota\nTexto secundario\n:::', resultado: 'Texto secundario' },
    lista: { sintaxis: '- Primer elemento\n- Segundo elemento', resultado: '• Primer elemento\n• Segundo elemento' },
    separador: { sintaxis: ':::separador\n:::', resultado: '────────────' },
    enlace: { sintaxis: '[Abrir](https://...)', resultado: 'Abrir' },
  };
   form = new FormGroup({ asunto: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }), markdown: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(30000)] }) });
   pruebaForm = new FormGroup({ email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }) });
   private readonly alturaPreviewFallback = 560;
   private frameResizeAnimation: number | null = null;
   private alturaPreviewAplicada = 0;
  ngOnInit(): void { this.clave = this.route.snapshot.paramMap.get('clave') || ''; this.form.valueChanges.pipe(debounceTime(400), distinctUntilChanged((a,b) => JSON.stringify(a) === JSON.stringify(b)), switchMap(() => this.preview$()), takeUntilDestroyed(this.destroyRef)).subscribe(); this.loading.show(); this.service.get(this.clave).pipe(finalize(() => { this.cargando = false; this.loading.hide(); })).subscribe({ next: t => { this.variables = t.variables; this.bloquesMarkdown = t.bloquesMarkdown ?? []; this.ayuda = t.ayuda ?? ''; this.form.patchValue({ asunto: t.asunto, markdown: t.markdown }, { emitEvent: false }); this.preview$().subscribe(); }, error: e => this.showError(e, 'No se pudo cargar el template.') }); }
   @HostListener('window:resize') reajustarAltura(): void { this.ajustarAlturaPreview(); }
   ajustarAlturaPreview(): void {
     if (this.frameResizeAnimation !== null) cancelAnimationFrame(this.frameResizeAnimation);
     this.frameResizeAnimation = requestAnimationFrame(() => {
       this.frameResizeAnimation = requestAnimationFrame(() => {
         this.frameResizeAnimation = null;
         this.aplicarAlturaPreview();
       });
     });
   }
   private aplicarAlturaPreview(): void {
     const iframe = this.previewFrame?.nativeElement;
     if (!iframe) return;

     const documento = iframe.contentDocument;
     const alturas = documento
       ? [documento.documentElement?.scrollHeight ?? 0, documento.body?.scrollHeight ?? 0]
       : [];
     const alturaContenido = Math.max(...alturas, 0);
     const altura = Math.max(this.alturaPreviewFallback, alturaContenido);
     if (alturaContenido === 0) console.warn('No se pudo obtener la altura del preview; se usa el fallback seguro.');
     if (altura === this.alturaPreviewAplicada) return;

     this.alturaPreviewAplicada = altura;
     iframe.style.height = `${altura}px`;
     if (this.markdownEditor?.nativeElement) this.markdownEditor.nativeElement.style.height = `${altura}px`;
   }
  private payload() { return this.form.getRawValue(); }
    private preview$() { this.previsualizando = true; return this.service.preview(this.clave, this.payload()).pipe(tap(p => { this.previewData = p; this.alturaPreviewAplicada = 0; this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(this.quitarScripts(p.html)); }), finalize(() => { setTimeout(() => { this.previsualizando = false; this.cdr.detectChanges(); this.ajustarAlturaPreview(); }); }), catchError(() => EMPTY)); }
  ejemploMarkdown(bloque: string): { sintaxis: string; resultado: string } { return this.ejemplosMarkdown[bloque as EmailTemplateBloqueMarkdown] ?? { sintaxis: 'Este bloque no tiene una vista de ayuda disponible.', resultado: 'Ayuda no disponible' }; }
  private quitarScripts(html: string): string { return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<script\b[^>]*\/\s*>/gi, ''); }
  guardar(): void { if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.guardando = true; this.service.update(this.clave, this.payload()).pipe(finalize(() => this.guardando = false)).subscribe({ next: () => this.messages.add({ severity: 'success', summary: 'Guardado', detail: 'El template se actualizó correctamente.' }), error: e => this.showError(e, 'No se pudo guardar el template.') }); }
  abrirPrueba(): void { this.pruebaVisible = true; } cerrarPrueba(): void { this.pruebaVisible = false; this.pruebaForm.reset(); }
  enviarPrueba(): void { if (this.pruebaForm.invalid || this.form.invalid) { this.pruebaForm.markAllAsTouched(); this.form.markAllAsTouched(); return; } this.enviandoPrueba = true; this.service.sendTest(this.clave, this.pruebaForm.controls.email.value.trim(), this.payload()).pipe(finalize(() => this.enviandoPrueba = false)).subscribe({ next: () => { this.cerrarPrueba(); this.messages.add({ severity: 'success', summary: 'Prueba enviada', detail: 'El email de prueba fue enviado.' }); }, error: e => this.showError(e, 'No se pudo enviar el email de prueba.') }); }
  volver(): void { this.router.navigate(['/email-template']); }
  private showError(error: { error?: { message?: string | string[] } }, fallback: string): void { const message = error.error?.message; this.messages.add({ severity: 'error', summary: 'Error de validación', detail: Array.isArray(message) ? message.join(' ') : message || fallback }); }
}
