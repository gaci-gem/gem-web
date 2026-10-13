import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmailTemplateService } from '@core/services/email-templates';
import { UiCard } from '@app/components/ui-card';

@Component({ selector: 'app-evento-asignado-markdown-prototype', standalone: true, imports: [CommonModule, ReactiveFormsModule, UiCard], templateUrl: './evento-asignado-markdown-prototype.html' })
export class EventoAsignadoMarkdownPrototype {
  private readonly service = inject(EmailTemplateService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  markdown = new FormControl('Hola {{nombre}},\n\nSe te asignó un nuevo evento. Estos son sus datos principales:\n\n## {{tituloEvento}}\n\n:::datos\n- Evento: {{tituloEvento}}\n- Prioridad: {{prioridadTxt}}\n- Fecha: {{fechaEvento}}\n:::\n\n:::boton url="urlEvento" align="center"\nVer evento\n:::\n\nSaludos, equipo GEM.', { nonNullable: true });
  preview: SafeHtml | null = null;
  cargando = false;
  variables = ['nombre', 'tituloEvento', 'prioridadTxt', 'fechaInicio', 'fechaFinEst', 'fechaFinReal', 'fechaEvento', 'etapaNombre', 'urlEvento'];

  constructor() { this.markdown.valueChanges.pipe(debounceTime(350), distinctUntilChanged(), switchMap(value => { this.cargando = true; return this.service.previewEventoAsignadoMarkdown(value); }), takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => { this.preview = this.sanitizer.bypassSecurityTrustHtml(result.html); this.cargando = false; }, error: () => { this.preview = null; this.cargando = false; } }); this.solicitarPreview(); }
  insertar(texto: string): void { const actual = this.markdown.value; this.markdown.setValue(`${actual}${actual ? '\n\n' : ''}${texto}`); }
  insertarDatos(): void { this.insertar(':::datos\nEtiqueta | {{tituloEvento}}\n:::'); }
  insertarBoton(): void { this.insertar(':::boton url="urlEvento" align="center" width="220px" variante="principal"\nVer evento\n:::'); }
  solicitarPreview(): void { this.service.previewEventoAsignadoMarkdown(this.markdown.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => this.preview = this.sanitizer.bypassSecurityTrustHtml(result.html)); }
}
