import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

export interface MentionOption {
  /** ID único del item (userId, codigo, etc.) */
  id: string;
  /** Texto principal que se muestra en el dropdown */
  label: string;
  /** Lo que se inserta después del trigger (e.g. "Jtorossian") */
  value: string;
  /** Texto secundario en el dropdown (e.g. email, rol) */
  sublabel?: string;
  /** Color para el avatar */
  color?: string;
}

@Component({
  selector: 'app-mention-textarea',
  standalone: true,
  imports: [],
  templateUrl: './mention-textarea.html',
  styleUrl: './mention-textarea.scss',
})
export class MentionTextareaComponent {
  @Input() value = '';
  @Input() placeholder = '';
  @Input() rows = 2;
  @Input() options: MentionOption[] = [];
  @Input() triggerChar = '@';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();
  /** Emite cada vez que el usuario selecciona un item del dropdown */
  @Output() mentionSelected = new EventEmitter<MentionOption>();
  /** Emite cuando el usuario presiona Ctrl+Enter */
  @Output() ctrlEnter = new EventEmitter<void>();

  @ViewChild('textareaRef') textareaRef!: ElementRef<HTMLTextAreaElement>;

  showDropdown = false;
  filteredOptions: MentionOption[] = [];
  activeIndex = 0;

  private mentionStart = -1;

  onInput(): void {
    const textarea = this.textareaRef.nativeElement;
    const text = textarea.value;
    this.valueChange.emit(text);
    this.detectMention(text, textarea.selectionStart ?? 0);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.ctrlEnter.emit();
      return;
    }

    if (!this.showDropdown) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.filteredOptions.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.filteredOptions[this.activeIndex]) {
        this.selectOption(this.filteredOptions[this.activeIndex]);
      }
    } else if (event.key === 'Escape') {
      this.closeDropdown();
    }
  }

  selectOption(option: MentionOption): void {
    const textarea = this.textareaRef.nativeElement;
    const text = textarea.value;
    const cursor = textarea.selectionStart ?? 0;

    const before = text.slice(0, this.mentionStart);
    const after = text.slice(cursor);
    const inserted = `${this.triggerChar}${option.value} `;
    const newText = before + inserted + after;
    const newCursor = before.length + inserted.length;

    // Actualizar DOM directamente para mantener cursor
    textarea.value = newText;
    this.value = newText;
    this.valueChange.emit(newText);
    this.mentionSelected.emit(option);
    this.closeDropdown();

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    });
  }

  getInitials(value: string): string {
    return value.slice(0, 2).toUpperCase();
  }

  private detectMention(text: string, cursor: number): void {
    const beforeCursor = text.slice(0, cursor);
    const atIndex = beforeCursor.lastIndexOf(this.triggerChar);

    if (atIndex === -1) {
      this.closeDropdown();
      return;
    }

    const afterTrigger = beforeCursor.slice(atIndex + 1);

    // Si hay espacio o salto de línea entre el trigger y el cursor, no es una mención activa
    if (/[\s\n]/.test(afterTrigger)) {
      this.closeDropdown();
      return;
    }

    const query = afterTrigger.toLowerCase();
    this.mentionStart = atIndex;

    this.filteredOptions = query.length === 0
      ? this.options.slice(0, 8)
      : this.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(query) ||
            opt.value.toLowerCase().includes(query)
        );

    this.activeIndex = 0;
    this.showDropdown = this.filteredOptions.length > 0;
  }

  private closeDropdown(): void {
    this.showDropdown = false;
    this.filteredOptions = [];
    this.mentionStart = -1;
    this.activeIndex = 0;
  }
}
