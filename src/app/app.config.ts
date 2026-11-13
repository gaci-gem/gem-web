import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@core/interceptors/auth-interceptor'
import { credentialsInterceptor } from '@core/interceptors/credentials-interceptor'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { registerLocaleData } from '@angular/common';
import esAR from '@angular/common/locales/es-AR';
import type { RuntimeConfig } from '@core/services/version';
import { environment } from '@/environments/environment';

registerLocaleData(esAR);

export function createAppConfig(runtimeConfig: RuntimeConfig = {}): ApplicationConfig {
  const license = runtimeConfig.license?.trim() || environment.license?.trim();
  const primeNgConfig = {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: '.my-app-dark'
      }
    },
    ...(license
      ? { license }
      : {})
  };

  return {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
     provideHttpClient(withInterceptors([credentialsInterceptor, authInterceptor])),
    provideAnimationsAsync(),
     providePrimeNG(primeNgConfig),
     {provide: LOCALE_ID, useValue: 'es-AR' }
  ]
  };
}

export const appConfig = createAppConfig();
