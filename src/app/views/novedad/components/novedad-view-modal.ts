import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { NgIcon } from '@ng-icons/core';
import { TimeAgoComponent } from '@app/components/time-ago/time-ago';
import { Novedad } from '@core/interfaces/novedad';
import { NovedadService } from '@core/services/novedad';
import { marked } from 'marked';
import { getTipoBadge, getTipoIcon, getEstadoBadge } from '@common/novedad-utils';

@Component({
  selector: 'app-novedad-view-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, NgIcon, TimeAgoComponent],
  template: `
    <div class="p-3 d-flex flex-column" style="min-height: 300px;">
      <!-- Header badges -->
      <div class="d-flex align-items-center gap-2 mb-3">
        <span class="badge {{ getTipoBadge(novedad.tipo) }}" style="font-size: 0.85rem;">
          <ng-icon [name]="getTipoIcon(novedad.tipo)" class="me-1" />
          {{ novedad.tipo }}
        </span>
        <span class="badge {{ getEstadoBadge(novedad.estado) }}" style="font-size: 0.85rem;">
          {{ novedad.estado }}
        </span>
      </div>

      <!-- Title -->
      <h4 class="mb-3 fw-bold">{{ novedad.titulo }}</h4>

      <!-- Content (markdown) -->
      <div
        class="markdown-body mb-4"
        [innerHTML]="renderContent()"
      ></div>

      <!-- Footer -->
      <div class="mt-auto border-top pt-3">
        <div class="text-muted small d-flex flex-wrap gap-3 mb-3">
          @if (novedad.createdBy) {
            <span>
              <ng-icon name="lucideUser" class="me-1" />
              {{ novedad.createdBy.usuario || novedad.createdBy.nombre || '—' }}
            </span>
          }
          <span>
            <ng-icon name="lucideCalendar" class="me-1" />
            <app-time-ago [fecha]="novedad.createdAt" />
          </span>
          @if (novedad.validezHasta) {
            <span>
              <ng-icon name="lucideClock" class="me-1" />
              Válido hasta {{ novedad.validezHasta | date:'dd/MM/yyyy' }}
            </span>
          }
        </div>

        <div class="d-flex gap-2 justify-content-end">
          <button type="button" (click)="close()" class="btn btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .markdown-body {
      line-height: 1.7;
      overflow-wrap: break-word;
    }
    .markdown-body :deep(h1),
    .markdown-body :deep(h2),
    .markdown-body :deep(h3),
    .markdown-body :deep(h4) {
      margin-top: 1.2em;
      margin-bottom: 0.6em;
      font-weight: 600;
    }
    .markdown-body :deep(p) {
      margin-bottom: 0.8em;
    }
    .markdown-body :deep(ul),
    .markdown-body :deep(ol) {
      padding-left: 1.5em;
      margin-bottom: 0.8em;
    }
    .markdown-body :deep(code) {
      background: #f0f0f0;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }
    .markdown-body :deep(pre) {
      background: #f5f5f5;
      padding: 1em;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 0.8em;
    }
    .markdown-body :deep(pre code) {
      background: none;
      padding: 0;
    }
    .markdown-body :deep(blockquote) {
      border-left: 4px solid #ddd;
      padding-left: 1em;
      color: #666;
      margin-bottom: 0.8em;
    }
    .markdown-body :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }
  `],
})
export class NovedadViewModal implements OnInit {
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private sanitizer = inject(DomSanitizer);
  private novedadService = inject(NovedadService);

  novedad!: Novedad;
  loaded = false;

  readonly getTipoBadge = getTipoBadge;
  readonly getTipoIcon = getTipoIcon;
  readonly getEstadoBadge = getEstadoBadge;

  ngOnInit(): void {
    const data = this.config.data;
    if (data?.novedad) {
      this.novedad = data.novedad;
      this.loaded = true;
    } else if (data?.novedadId) {
      this.novedadService.getById(data.novedadId).subscribe({
        next: (n) => {
          this.novedad = n;
          this.loaded = true;
        },
      });
    }
  }

  renderContent(): SafeHtml {
    if (!this.novedad?.contenido) return '';
    try {
      const html = marked.parse(this.novedad.contenido) as string;
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch {
      return this.novedad.contenido;
    }
  }

  close(): void {
    this.ref.close();
  }
}
