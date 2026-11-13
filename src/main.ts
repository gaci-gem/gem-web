/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { createAppConfig } from './app/app.config';
import { App } from './app/app';
import { RuntimeConfig } from './app/core/services/version';

fetch('assets/runtime-config.json?nocache=' + Date.now())
  .then(response => response.ok ? response.json() as Promise<RuntimeConfig> : {})
  .catch(() => ({} as RuntimeConfig))
  .then(runtimeConfig => bootstrapApplication(App, createAppConfig(runtimeConfig)))
  .catch((err) => console.error(err));
