import { Component, input, output } from '@angular/core';
import { Product } from '../../models/product.model';
import { RouterLink } from '@angular/router';
import { CalendarDatePipe } from '../../../../shared/pipes/calendar-date.pipe';

@Component({
  imports: [CalendarDatePipe, RouterLink],
  selector: 'app-product-table',
  styleUrl: './product-table.scss',
  templateUrl: './product-table.html',
  host: {
    '(window:resize)': 'closeActions()',
    '(window:scroll)': 'closeActions()',
  },
})
export class ProductTable {
  readonly deleteProduct = output<Product>();
  readonly products = input.required<Product[]>();
  private activeMenu: HTMLElement | null = null;

  toggleActions(event: MouseEvent, menu: HTMLElement): void {
    event.preventDefault();
    const trigger = event.currentTarget as HTMLButtonElement;
    const open = menu.togglePopover();
    trigger.setAttribute('aria-expanded', String(open));
    if (!open) return;

    this.activeMenu = menu;
    const button = trigger.getBoundingClientRect();
    const panel = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(button.right - panel.width, window.innerWidth - panel.width - 8))}px`;
    menu.style.top = `${Math.max(8, button.bottom + panel.height + 4 <= window.innerHeight ? button.bottom + 4 : button.top - panel.height - 4)}px`;
  }

  onActionsToggle(event: Event, trigger: HTMLButtonElement): void {
    const open = (event as ToggleEvent).newState === 'open';
    trigger.setAttribute('aria-expanded', String(open));
    if (!open && event.target === this.activeMenu) this.activeMenu = null;
  }

  closeActions(): void {
    this.activeMenu?.hidePopover();
  }
}
