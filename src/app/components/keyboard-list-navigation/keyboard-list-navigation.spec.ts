import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KeyboardListNavigation } from './keyboard-list-navigation';

@Component({
  standalone: true,
  imports: [KeyboardListNavigation],
  template: `<div appKeyboardListNavigation [keyboardListItems]="items" (keyboardRowActivate)="activated = $event">
    <table><tbody><tr><td>A</td></tr><tr><td>B</td></tr></tbody></table>
  </div>`,
})
class HostComponent {
  items = ['a', 'b'];
  activated?: string;
}

describe('KeyboardListNavigation', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('moves between rows and activates the focused row', () => {
    const host = fixture.nativeElement.querySelector('div') as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.activated).toBe('b');
  });
});
