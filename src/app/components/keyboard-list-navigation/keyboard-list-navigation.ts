import { Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, inject } from '@angular/core';

@Directive({ selector: '[appKeyboardListNavigation]', standalone: true })
export class KeyboardListNavigation<T> {
  @Input() keyboardListItems: T[] = [];
  @Input() keyboardListSelectable = false;
  @Output() keyboardRowActivate = new EventEmitter<T>();
  @HostBinding('attr.role') readonly role = 'grid';
  @HostBinding('attr.tabindex') readonly tabindex = '0';

  private readonly host = inject(ElementRef<HTMLElement>);
  private rowIndex = 0;

  @HostListener('focusin') onFocus(): void { this.updateRows(); }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const rows = this.rows();
    if (!rows.length) return;
    const row = event.target instanceof Element ? event.target.closest('tr') : null;
    if (row) this.rowIndex = Math.max(0, rows.indexOf(row as HTMLTableRowElement));
    this.updateRows();
    const move = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : event.key === 'Home' ? -Infinity : event.key === 'End' ? Infinity : 0;
    if (move) {
      event.preventDefault();
      this.rowIndex = move === Infinity ? rows.length - 1 : move === -Infinity ? 0 : Math.min(rows.length - 1, Math.max(0, this.rowIndex + move));
      rows[this.rowIndex].focus();
      rows[this.rowIndex].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.keyboardRowActivate.emit(this.keyboardListItems[this.rowIndex]);
    } else if (event.key === ' ' && this.keyboardListSelectable) {
      event.preventDefault();
      rows[this.rowIndex].click();
    }
  }

  private rows(): HTMLTableRowElement[] {
    const host = this.host.nativeElement as HTMLElement;
    return Array.from(host.querySelectorAll<HTMLTableRowElement>('tbody tr:not(.p-datatable-emptymessage)'));
  }

  private updateRows(): void {
    this.rows().forEach((row, index) => {
      row.tabIndex = index === this.rowIndex ? 0 : -1;
      row.setAttribute('role', 'row');
    });
  }
}
