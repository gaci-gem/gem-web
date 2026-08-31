import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { DialogModule } from 'primeng/dialog';
import { environment } from '@/environments/environment';

@Component({
  selector: 'app-integration-setup-modal',
  standalone: true,
  imports: [AccordionModule, DialogModule],
  template: `
    <p-dialog
      [visible]="visible"
      (visibleChange)="cerrar()"
      [modal]="true"
      [style]="{ width: 'min(42rem, 95vw)' }"
      header="Configurar gem-mcp"
    >
      <p class="mb-3">Usá este token sólo como credencial técnica para configurar gem-mcp. No lo pegues en prompts, repositorios ni archivos fuente.</p>
      <p>Antes de configurar cualquier instalación, guardá el token en las variables de entorno de usuario desde PowerShell:</p>
      <div class="d-flex align-items-start gap-2 mb-3">
        <div class="bg-dark text-light rounded p-2 overflow-auto" style="white-space: pre; min-width: 0; width: 0; flex: 1 1 0; max-width: 100%;">
          <code class="text-light d-block" style="white-space: pre; width: max-content; max-width: none;">{{ persistentTokenCommand }}</code>
        </div>
        <a href="#" class="text-primary ms-1 flex-shrink-0 align-self-center" (click)="copiarDesdeEnlace($event, persistentTokenCommand, 'command')" aria-label="Copiar comando persistente" title="Copiar comando persistente">
          <i class="pi pi-copy small" aria-hidden="true"></i>
        </a>
      </div>
      <p-accordion value="0">
        <p-accordion-panel value="0">
          <p-accordion-header>Aplicación local de ChatGPT</p-accordion-header>
          <p-accordion-content>
            <p>Con la variable configurada, reiniciá la aplicación de ChatGPT y seguí estos pasos:</p>
            <ol>
              <li>Abrí la aplicación de ChatGPT.</li>
              <li>Entrá a <strong>Complementos</strong> y abrí el engranaje de <strong>Administrar</strong>.</li>
              <li>Ingresá a la pestaña <strong>MCP</strong>.</li>
              <li>
                Seleccioná <strong>+ Agregar servidor</strong> y completá:
                <ul>
                  <li><strong>Nombre:</strong> GEM MCP</li>
                  <li><strong>Tipo:</strong> HTTP secuenciable</li>
                  <li>En <strong>URL</strong>, usá <code>{{ mcpUrl }}</code>
                    <a href="#" class="text-primary ms-1 align-middle" (click)="copiarDesdeEnlace($event, mcpUrl, 'url')" aria-label="Copiar URL MCP" title="Copiar URL MCP">
                      <i class="pi pi-copy small align-middle" aria-hidden="true"></i>
                    </a>
                  </li>
                  <li>En la <strong>Variable de entorno del token portador</strong>, indicá <code>{{ tokenEnvironmentVariable }}</code>
                    <a href="#" class="text-primary ms-1 align-middle" (click)="copiarDesdeEnlace($event, tokenEnvironmentVariable, 'variable')" aria-label="Copiar variable GEM_MCP_TOKEN" title="Copiar variable GEM_MCP_TOKEN">
                      <i class="pi pi-copy small align-middle" aria-hidden="true"></i>
                    </a>
                  </li>
                </ul>
              </li>
              <li>Presioná <strong>Guardar</strong>.</li>
            </ol>
          </p-accordion-content>
        </p-accordion-panel>
        <p-accordion-panel value="1">
          <p-accordion-header>Terminal y Codex</p-accordion-header>
          <p-accordion-content>
            <p class="small text-muted">Alternativa para configurar el entorno local. Reemplazá sólo los marcadores; nunca escribas un token real en el código.</p>
            <div class="d-flex align-items-start gap-2 mb-2">
              <div class="bg-dark text-light rounded p-2 overflow-auto" style="white-space: pre; min-width: 0; width: 0; flex: 1 1 0; max-width: 100%;">
                <code class="text-light d-block" style="white-space: pre; width: max-content; max-width: none;">{{ codexCommand }}</code>
              </div>
              <a href="#" class="text-primary ms-1 flex-shrink-0 align-self-center" (click)="copiarDesdeEnlace($event, codexCommand, 'codex')" aria-label="Copiar comando de Codex" title="Copiar comando de Codex">
                <i class="pi pi-copy small" aria-hidden="true"></i>
              </a>
            </div>
            <p class="small mb-0">Con la variable configurada, iniciá Codex y usá el comando anterior.</p>
          </p-accordion-content>
        </p-accordion-panel>
      </p-accordion>
      <div class="d-flex justify-content-end mt-4">
        <button type="button" class="btn btn-primary" (click)="cerrar()">Cerrar</button>
      </div>
    </p-dialog>
  `,
})
export class IntegrationSetupModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  readonly mcpUrl = environment.mcpUrl;
  readonly tokenEnvironmentVariable = 'GEM_MCP_TOKEN';
  readonly persistentTokenCommand =
    "[Environment]::SetEnvironmentVariable('GEM_MCP_TOKEN', '<PEGAR_TOKEN_LOCALMENTE>', 'User')";
  readonly codexCommand =
    `codex mcp add gem-mcp --url "${this.mcpUrl}" --bearer-token-env-var GEM_MCP_TOKEN`;
  copied: 'url' | 'variable' | 'command' | 'codex' | null = null;
  copyError: string | null = null;

  async copiar(value: string, target: 'url' | 'variable' | 'command' | 'codex'): Promise<void> {
    this.copyError = null;
    this.copied = null;
    try {
      await navigator.clipboard.writeText(value);
      this.copied = target;
    } catch {
      this.copyError = 'No se pudo copiar. Seleccioná el valor manualmente.';
    }
  }

  copiarDesdeEnlace(
    event: Event,
    value: string,
    target: 'url' | 'variable' | 'command' | 'codex',
  ): void {
    event.preventDefault();
    void this.copiar(value, target);
  }

  cerrar(): void {
    this.copied = null;
    this.copyError = null;
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
