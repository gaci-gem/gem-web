import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, DestroyRef, ElementRef, HostListener, signal, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, filter, of, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { LayoutStoreService } from '@core/services/layout-store.service';
import { SHORTCUTS } from '@/app/constants/shortcut';
import { COMMAND_PALETTE_COMMANDS, CommandPaletteCommand } from './command-palette.commands';
import { EventCommandService } from '@core/services/event-command.service';
import { GlobalSearchResult } from '@core/interfaces/global-search';
import { GlobalSearchService } from '@core/services/global-search';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, InputTextModule, NgIcon],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
})
export class CommandPalette {
  private readonly router = inject(Router);
  private readonly layout = inject(LayoutStoreService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventCommandService = inject(EventCommandService);
  private readonly globalSearchService = inject(GlobalSearchService);
  private readonly searchSubject = new Subject<string>();

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('results') private results?: ElementRef<HTMLElement>;

  readonly commands = COMMAND_PALETTE_COMMANDS;
  visible = false;
  query = '';
  activeIndex = signal(0);
  currentUrl = this.router.url;
  globalResults = signal<GlobalSearchResult[]>([]);
  searchLoading = signal(false);
  searchError = signal(false);
  private opener: HTMLElement | null = null;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
      });

    this.searchSubject.pipe(
      debounceTime(275),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query) return of(null);
        this.searchLoading.set(true);
        this.searchError.set(false);
        return this.globalSearchService.search(query).pipe(
          catchError(() => of(null)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(response => {
      this.globalResults.set(response ?? []);
      this.searchError.set(response === null && !!this.query.trim());
      this.searchLoading.set(false);
      this.activeIndex.set(0);
    });
  }

  get filteredCommands(): CommandPaletteCommand[] {
    const query = this.query.trim().toLocaleLowerCase();
    return this.commands.filter((command) => !query || `${command.label} ${command.keywords}`.toLocaleLowerCase().includes(query));
  }

  get groupedCommands(): { group: string; commands: CommandPaletteCommand[] }[] {
    return ['Navegación', 'Acciones frecuentes']
      .map((group) => ({ group, commands: this.filteredCommands.filter((command) => command.group === group) }))
      .filter((section) => section.commands.length > 0);
  }

  readonly combinedResults = computed(() => [
    ...this.filteredCommands.map(value => ({ kind: 'command' as const, value })),
    ...this.globalResults().map(value => ({ kind: 'global' as const, value })),
  ]);

  readonly activeCommandId = computed(() => {
    const item = this.combinedResults()[this.activeIndex()];
    return item?.kind === 'command' ? `command-${item.value.id}` : item?.kind === 'global' ? `global-${item.value.entity}-${item.value.id}` : null;
  });

  open(): void {
    this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.visible = true;
    this.query = '';
    this.globalResults.set([]);
    this.searchLoading.set(false);
    this.searchError.set(false);
    this.activeIndex.set(0);
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  focusSearch(): void {
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  close(): void {
    this.visible = false;
    const opener = this.opener;
    setTimeout(() => opener?.focus());
  }

  onQueryChange(): void {
    this.activeIndex.set(0);
    const query = this.query.trim();
    this.globalResults.set([]);
    this.searchLoading.set(!!query);
    this.searchSubject.next(query);
  }

  onKeydown(event: KeyboardEvent): void {
    const results = this.combinedResults();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.set(results.length ? (this.activeIndex() + 1) % results.length : 0);
      this.scrollActiveCommandIntoView();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.set(results.length ? (this.activeIndex() - 1 + results.length) % results.length : 0);
      this.scrollActiveCommandIntoView();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = results[this.activeIndex()];
      if (item?.kind === 'command') this.execute(item.value);
      if (item?.kind === 'global') this.openGlobalResult(item.value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  private scrollActiveCommandIntoView(): void {
    const item = this.combinedResults()[this.activeIndex()];
    if (!item) return;
    const id = item.kind === 'command' ? `command-${item.value.id}` : `global-${item.value.entity}-${item.value.id}`;

    setTimeout(() => {
      const element = this.results?.nativeElement.querySelector<HTMLElement>(`#${id}`);
      element?.scrollIntoView({ block: 'nearest' });
    });
  }

  execute(command: CommandPaletteCommand): void {
    if (command.disabled) return;
    this.close();
    if (command.id === 'create-event') this.eventCommandService.requestCreateEvent();
    if (command.route) void this.router.navigateByUrl(command.route);
    if (command.action === 'toggle-theme') {
      this.layout.setTheme(this.layout.theme === 'dark' ? 'light' : 'dark');
    }
  }

  isActive(command: CommandPaletteCommand): boolean {
    const item = this.combinedResults()[this.activeIndex()];
    return item?.kind === 'command' && item.value.id === command.id;
  }

  activateCommand(command: CommandPaletteCommand): void {
    this.activeIndex.set(this.filteredCommands.indexOf(command));
  }

  isGlobalActive(result: GlobalSearchResult): boolean {
    const item = this.combinedResults()[this.activeIndex()];
    return item?.kind === 'global' && item.value.entity === result.entity && item.value.id === result.id;
  }

  activateGlobalResult(result: GlobalSearchResult): void {
    this.activeIndex.set(this.combinedResults().findIndex(item => item.kind === 'global' && item.value.entity === result.entity && item.value.id === result.id));
  }

  openGlobalResult(result: GlobalSearchResult): void {
    this.close();
    const route = result.entity === 'eventos'
      ? `/evento/evento/${result.id}`
      : result.entity === 'clientes'
        ? '/cliente/clientes'
        : '/proyecto/proyectos';
    if (result.entity === 'eventos') void this.router.navigateByUrl(route);
    else void this.router.navigate([route], { queryParams: { searchId: result.id } });
  }

  isCurrent(command: CommandPaletteCommand): boolean {
    if (!command.route) return false;
    const currentPath = this.currentUrl.split(/[?#]/, 1)[0];
    return currentPath === command.route || currentPath.startsWith(`${command.route}/`);
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if (!event.altKey) return;
    if (this.isTypingTarget(event.target) || this.hasActiveDialog()) return;

    if (event.key.toUpperCase() === SHORTCUTS.PALETA.combo.replace('Alt+', '')) {
      event.preventDefault();
      this.visible ? this.close() : this.open();
      return;
    }

    const command = this.commands.find(item => item.shortcut?.combo === `Alt+${event.key}`);
    if (command) {
      event.preventDefault();
      this.execute(command);
    }
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    return !!element && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));
  }

  private hasActiveDialog(): boolean {
    return Array.from(document.querySelectorAll<HTMLElement>('.p-dialog-mask, .p-confirmdialog'))
      .some(element => getComputedStyle(element).display !== 'none' && element.getAttribute('aria-hidden') !== 'true');
  }
}
