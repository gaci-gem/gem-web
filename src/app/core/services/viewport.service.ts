import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mobileQuery = '(max-width: 767px)';

  readonly isMobile = signal(this.readIsMobile());

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const mediaQuery = window.matchMedia(this.mobileQuery);
    const update = (event: MediaQueryListEvent) => this.isMobile.set(event.matches);
    mediaQuery.addEventListener('change', update);
    this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', update));
  }

  private readIsMobile(): boolean {
    return isPlatformBrowser(this.platformId) && window.matchMedia(this.mobileQuery).matches;
  }
}
