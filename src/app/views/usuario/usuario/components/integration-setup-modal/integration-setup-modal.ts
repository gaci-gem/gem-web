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
        <pre class="bg-dark text-light rounded p-2 overflow-auto" style="white-space: pre; min-width: 0; width: 0; flex: 1 1 0; max-width: 100%; user-select: text;"><code class="text-light" style="white-space: pre;">{{ persistentTokenCommand }}</code></pre>
        <button type="button" class="btn btn-link text-primary p-0 ms-1 flex-shrink-0 align-self-center" (click)="copiar(persistentTokenCommand, 'command')" aria-label="Copiar comando persistente" title="Copiar comando persistente">
          <i class="pi pi-copy small" aria-hidden="true"></i>
        </button>
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
              <pre class="bg-dark text-light rounded p-2 overflow-auto" style="white-space: pre; min-width: 0; width: 0; flex: 1 1 0; max-width: 100%; user-select: text;"><code class="text-light" style="white-space: pre;">{{ codexCommand }}</code></pre>
              <button type="button" class="btn btn-link text-primary p-0 ms-1 flex-shrink-0 align-self-center" (click)="copiar(codexCommand, 'codex')" aria-label="Copiar comando de Codex" title="Copiar comando de Codex">
                <i class="pi pi-copy small" aria-hidden="true"></i>
              </button>
            </div>
            <p class="small mb-0">Con la variable configurada, iniciá Codex y usá el comando anterior.</p>
          </p-accordion-content>
        </p-accordion-panel>
        <p-accordion-panel value="2">
          <p-accordion-header>OpenCode</p-accordion-header>
          <p-accordion-content>
            <p>Creá o editá <code>~/.config/opencode/opencode.json</code>, conservá los campos existentes y agregá este bloque dentro de <code>mcp</code>:</p>
            <div class="d-flex align-items-start gap-2 mb-2">
              <pre class="bg-dark text-light rounded p-2 overflow-auto" style="white-space: pre; min-width: 0; width: 0; flex: 1 1 0; max-width: 100%; user-select: text;"><code class="text-light" style="white-space: pre;">{{ openCodeConfig }}</code></pre>
              <button type="button" class="btn btn-link text-primary p-0 ms-1 flex-shrink-0 align-self-center" (click)="copiar(openCodeConfig, 'opencode')" aria-label="Copiar configuración de OpenCode" title="Copiar configuración de OpenCode">
                <i class="pi pi-copy small" aria-hidden="true"></i>
              </button>
            </div>
            <ol>
              <li>Guardá el archivo.</li>
              <li>Reiniciá OpenCode para que cargue la configuración.</li>
            </ol>
            <p class="small mb-0">OpenCode leerá el token desde la variable de entorno <code>GEM_MCP_TOKEN</code>; no lo guardes en el archivo.</p>
          </p-accordion-content>
        </p-accordion-panel>
      </p-accordion>
      @if (copied) {
        <p class="small text-success mt-2 mb-0" aria-live="polite">Copiado.</p>
      }
      @if (copyError) {
        <p class="small text-danger mt-2 mb-0" aria-live="assertive">{{ copyError }}</p>
      }
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
  readonly openCodeConfig = `"gem-mcp": {
  "type": "remote",
  "url": "${this.mcpUrl}",
  "headers": { "Authorization": "Bearer {env:GEM_MCP_TOKEN}" }
}`;
  copied: 'url' | 'variable' | 'command' | 'codex' | 'opencode' | null = null;
  copyError: string | null = null;

  async copiar(value: string, target: 'url' | 'variable' | 'command' | 'codex' | 'opencode'): Promise<void> {
    this.copyError = null;
    this.copied = null;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        this.copiarConSeleccion(value);
      }
      this.copied = target;
    } catch {
      this.copyError = 'No se pudo copiar. Seleccioná el valor manualmente.';
    }
  }

  private copiarConSeleccion(value: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      if (!document.execCommand('copy')) throw new Error('Copy command failed');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  copiarDesdeEnlace(
    event: Event,
    value: string,
    target: 'url' | 'variable' | 'command' | 'codex' | 'opencode',
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
