import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filtro-radio-group',
  imports: [
    NgIcon,
    TooltipModule,
    CommonModule,
    SelectButtonModule,
    FormsModule
  ],
  template: `
    <p-selectbutton
      [options]="options"
      [(ngModel)]="checkedValue"
      (ngModelChange)="onChange($event)"
      optionLabel="label"
      optionValue="value"
      size="small"
    >
      <ng-template let-item>
        <!-- @if(!notIcon && item.icon) { -->
          <ng-icon [name]="item.icon" />
        <!-- } -->
        <!-- @if(!notLabel && (!item.icon || !notIcon)) {
          <span [ngClass]="(item.icon && !notIcon ? 'ms-1' : '')">{{ item.label }}</span>
        } -->
      </ng-template>
    </p-selectbutton>
  `
})
export class FiltroRadioGroupComponent {
  @Input() options: {value:string, label:string, icon?:string}[] = [
    { value: 'all', label: 'Todos', icon: 'lucideAsterisk' },
    { value: 'false', label: 'Abiertos', icon: 'lucideLockKeyholeOpen' },
    { value: 'true', label: 'Cerrados', icon: 'lucideLockKeyhole' }
  ];
  @Input() name = 'btnradio';
  @Input() checkedValue = 'all';
  @Input() notIcon: boolean = false;
  @Input() notLabel: boolean = false;

  @Output() filtroCambio = new EventEmitter<string>();

  onChange(value: string) {
    this.filtroCambio.emit(value);
  }
}