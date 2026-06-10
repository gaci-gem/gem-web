import { Component, Input, OnDestroy, signal } from '@angular/core';
import { getTimeAgo } from '@/app/utils/datetime-utils';

@Component({
  selector: 'app-time-ago',
  standalone: true,
  template: `
    <span (click)="toggle()" style="cursor: pointer">{{ displayText() }}</span>
  `,
})
export class TimeAgoComponent implements OnDestroy {
  @Input() set fecha(v: Date | string | undefined | null) {
    this._fecha = v;
    this.refresh();
  }

  private _fecha: Date | string | undefined | null = null;
  private showRelative = true;
  private initialized = false;
  readonly displayText = signal('');
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.intervalId = setInterval(() => this.refresh(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  toggle(): void {
    this.showRelative = !this.showRelative;
    this.refresh();
  }

  private refresh(): void {
    const f = this._fecha;
    if (!f) {
      this.displayText.set('');
      return;
    }
    const date = typeof f === 'string' ? new Date(f) : f;
    if (isNaN(date.getTime())) {
      this.displayText.set('');
      return;
    }

    if (!this.initialized) {
      const diffMs = Date.now() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      this.showRelative = diffDays <= 30;
      this.initialized = true;
    }

    if (this.showRelative) {
      this.displayText.set(getTimeAgo(date));
    } else {
      this.displayText.set(this.formatDate(date));
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
