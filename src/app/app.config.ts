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

registerLocaleData(esAR);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
     provideHttpClient(withInterceptors([credentialsInterceptor, authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
          preset: Aura,
          options: {
              darkModeSelector: '.my-app-dark'
          }
      }
    }),
    {provide: LOCALE_ID, useValue: 'es-AR' }
  ]
};
