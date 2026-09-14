import { SHORTCUTS, ShortcutKey } from '@/app/constants/shortcut';
import { Injectable, OnDestroy } from '@angular/core';
import { filter, fromEvent, map, Observable, shareReplay, Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShortcutService implements OnDestroy {
  private destroy$ = new Subject<void>();

  private keydown$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    filter(event => !event.repeat),
    filter(event => {
      const target = event.target as HTMLElement | null;
      const isTyping = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      const dialogOpen = Array.from(document.querySelectorAll<HTMLElement>('.p-dialog-mask, .p-confirmdialog'))
        .some(element => getComputedStyle(element).display !== 'none' && element.getAttribute('aria-hidden') !== 'true');
      return (!isTyping && !dialogOpen) || event.key === 'Escape';
    }),
    map(event => {
      const combo = this.normalizeShortcut(event);

      // Lista de combos para los que queremos evitar el comportamiento por defecto
      const combosPreventDefault = Object.values(SHORTCUTS).flatMap(definition =>
        'combos' in definition ? definition.combos : [definition.combo]
      );

      const target = event.target as HTMLElement | null;
      const isTyping = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      const dialogOpen = Array.from(document.querySelectorAll<HTMLElement>('.p-dialog-mask, .p-confirmdialog'))
        .some(element => getComputedStyle(element).display !== 'none' && element.getAttribute('aria-hidden') !== 'true');
      if (!isTyping && (!dialogOpen || combo === 'ESCAPE') && (combosPreventDefault as readonly string[]).map(value => value.toUpperCase()).includes(combo.toUpperCase())) {
        event.preventDefault();
      }

      return combo;
    }),
    takeUntil(this.destroy$)
  );

  onShortcut(): Observable<string> {
    return this.keydown$;
  }

  private normalizeShortcut(event: KeyboardEvent): string {
    let combo = '';
    if (event.ctrlKey) combo += 'Ctrl+';
    if (event.altKey) combo += 'Alt+';
    if (event.shiftKey) combo += 'Shift+';
    return combo + event.key.toUpperCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
