import { Routes } from '@angular/router';
import { emailTemplateGuard } from '@core/guards/email-template.guard';
import { EmailTemplateEditor } from './email-template-editor/email-template-editor';
import { EmailTemplateList } from './email-templates/email-template-list';
import { EventoAsignadoMarkdownPrototype } from './evento-asignado-markdown-prototype/evento-asignado-markdown-prototype';
import { MarkdownPrototype } from './markdown-prototype/markdown-prototype';

export const EMAIL_TEMPLATE_ROUTES: Routes = [
  {
    path: 'email-template', component: EmailTemplateList,
    data: { title: 'Templates de email' },
    canActivate: [emailTemplateGuard],
  },
  { path: 'email-template/prototipo/markdown', component: MarkdownPrototype, data: { title: 'Prototipo Markdown común' }, canActivate: [emailTemplateGuard] },
  { path: 'email-template/:clave', component: EmailTemplateEditor, data: { title: 'Editor de template de email' }, canActivate: [emailTemplateGuard] },
  { path: 'email-template/prototipo/evento-asignado-markdown', component: EventoAsignadoMarkdownPrototype, data: { title: 'Prototipo Markdown — Evento asignado' }, canActivate: [emailTemplateGuard] },
];
