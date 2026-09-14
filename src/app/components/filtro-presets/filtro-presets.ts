import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDropdown, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { DialogModule } from 'primeng/dialog';
import { FiltroPreset } from '@core/interfaces/filtro-preset';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-filtro-presets',
  standalone: true,
   imports: [CommonModule, FormsModule, NgbDropdownModule, DialogModule, NgIcon],
  templateUrl: './filtro-presets.html',
})
export class FiltroPresetsComponent {
  @ViewChild(NgbDropdown) private dropdown?: NgbDropdown;
  @Input({ required: true }) presets: FiltroPreset[] = [];
  @Input() selectedPresetId = '';
  @Output() selectedPresetIdChange = new EventEmitter<string>();
  @Output() apply = new EventEmitter<string>();
  @Output() save = new EventEmitter<{ id: string; name: string }>();
  @Output() remove = new EventEmitter<string>();
  @Output() setDefault = new EventEmitter<string>();
  @Output() clearFilters = new EventEmitter<void>();

  manageVisible = false;
  draftName = '';

  select(id: string): void {
    this.selectedPresetIdChange.emit(id);
  }

  openManager(): void {
    this.draftName = this.presets.find(preset => preset.id === this.selectedPresetId)?.nombre ?? '';
    this.manageVisible = true;
  }

  savePreset(): void {
    const name = this.draftName.trim();
    if (name) this.save.emit({ id: this.selectedPresetId, name });
  }

  presetName(id: string): string {
    return this.presets.find(preset => preset.id === id)?.nombre ?? '';
  }

  openMenu(): void {
    this.dropdown?.open();
  }
}
