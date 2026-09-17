import { Component, Input, Output, EventEmitter, HostBinding, OnChanges, SimpleChanges } from '@angular/core'
import { NgIcon } from '@ng-icons/core'
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap'
import { HelpTooltip } from '@app/components/help-tooltip';

@Component({
  selector: 'app-ui-card',
  imports: [NgIcon, NgbCollapse, HelpTooltip],
  template: `
    @if (isVisible) {
      <div
        class="card {{ isCollapsed ? 'card-collapse' : '' }} {{ className }}"
      >
        @if (withTitle) {
          
        <div
          class="card-header justify-content-between align-items-center"
          [class]="isCollapsed ? 'border-0' : ''"
        >
          <div class="d-flex w-100 justify-content-between align-items-center">
            <h5 class="card-title mb-0 d-flex align-items-center">
              @if (titleIcon && titleIconPosition === 'left') {
                <ng-icon [name]="titleIcon" class="me-2" />
              }
              <span class="flex-grow-1">{{ title }} <ng-content select="[badge-text]"></ng-content></span>
              @if (helperText) {
                <app-help-tooltip [text]="helperText" position="top" size="1rem" iconClass="pi pi-question-circle text-muted ms-2"></app-help-tooltip>
              } @else {
                <ng-content select="[helper-text]"></ng-content>
              }
              @if (titleIcon && titleIconPosition === 'right') {
                <ng-icon [name]="titleIcon" class="ms-2" />
              }
            </h5>
            <div class="d-flex align-items-center gap-2">
              <ng-content select="[card-actions]"></ng-content>
              @if (isTogglable || isReloadable || isCloseable) {
                <div class="card-action d-flex align-items-center gap-1">
                  @if (isReloadable) {
                    <button (click)="reload()" class="card-action-item border-0">
                      <ng-icon name="tablerRefresh" />
                    </button>
                  }
                  @if (isCloseable) {
                    <button (click)="close()" class="card-action-item border-0">
                      <ng-icon name="tablerX" />
                    </button>
                  }
                  @if (isTogglable) {
                    <button
                      (click)="isCollapsed = !isCollapsed"
                      class="card-action-item border-0"
                    >
                      @if (!isCollapsed) {
                        <ng-icon name="tablerChevronUp" />
                      }
                      @if (isCollapsed) {
                        <ng-icon name="tablerChevronDown" />
                      }
                    </button>
                  }
                </div>
              }
            </div>
            <ng-content select="[helper-text]"></ng-content>
          </div>
        </div>
        }

        <div
          class="card-body {{ bodyClass }}"
          #collapse="ngbCollapse"
          [(ngbCollapse)]="isCollapsed"
        >
          <ng-content select="[card-body]"></ng-content>
        </div>

        @if ((reloading !== null ? reloading : isReloading)) {
          <div class="card-overlay d-flex">
            <div class="spinner-border text-primary"></div>
          </div>
        }
      </div>
    }
  `,
})
export class UiCard implements OnChanges {
  // The card title is visual content, not a native tooltip for the host element.
  @HostBinding('attr.title') hostTitle: null = null

  @Input() withTitle: boolean = true;
  @Input() titleIcon?: string
  @Input() titleIconPosition: 'left' | 'right' = 'left'
  @Input() title!: string
  @Input() helperText?: string
  @Input() isTogglable?: boolean
  @Input() isReloadable?: boolean
  @Input() isCloseable?: boolean
  @Input() bodyClass?: string
  @Input() className?: string
  @Input() initialCollapsed: boolean = false
  @Input() reloading: boolean | null = null

  @Output() reloadCard = new EventEmitter<void>()

  isCollapsed = false
  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialCollapsed']) {
      this.isCollapsed = this.initialCollapsed;
    }
  }
  isReloading = false
  isVisible = true

  reload() {
    this.reloadCard.emit();
    if (this.reloading === null) {
      this.isReloading = true;
      setTimeout(() => (this.isReloading = false), 1500);
    }
    // Si el padre controla reloading, no modificar isReloading interno
  }

  close() {
    this.isVisible = false
  }
}
