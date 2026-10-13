export interface EmailTemplateConfig {
  clave: string;
  variables: EmailTemplateVariable[];
  asunto: string;
  markdown: string;
  familia?: string;
  marca?: EmailTemplateBrand;
  bloquesMarkdown?: EmailTemplateBloqueMarkdown[];
  ayuda?: string;
}

export interface EmailTemplateBrand { clave: string; nombre: string; logo: string; colores: string; urlVariable: string; }

export interface EmailTemplateVariable { token: string; nombre: string; descripcion: string; tipo?: 'texto' | 'url'; }
export interface EmailTemplateCatalogItem { clave: string; nombre: string; familia?: string; descripcion: string; visible?: boolean; editable: boolean; variables: EmailTemplateVariable[]; marca?: EmailTemplateBrand; bloquesMarkdown?: EmailTemplateBloqueMarkdown[]; }
export type EmailTemplateBloqueMarkdown = 'titulo' | 'inline' | 'datos' | 'boton' | 'codigo' | 'destacado' | 'nota' | 'lista' | 'separador' | 'enlace';

export type EmailTemplatePayload = { asunto: string; markdown: string };
export interface EmailTemplatePreview { clave: string; asunto: string; html: string; }
