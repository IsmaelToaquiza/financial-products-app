import { FeedbackMessage } from '../../../../shared/components/feedback-message/feedback-message';
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  input,
  output,
} from '@angular/core';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-delete-dialog',
  imports: [FeedbackMessage],
  templateUrl: './delete-dialog.html',
  styleUrl: './delete-dialog.scss',
})
export class DeleteDialog implements AfterViewInit, OnDestroy {
  readonly product = input.required<Product>();
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  private previousFocus =
    typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null;

  ngAfterViewInit(): void {
    this.dialog.nativeElement.showModal();
  }
  ngOnDestroy(): void {
    this.dialog.nativeElement.close();
    this.previousFocus?.focus();
  }
  onCancel(event: Event): void {
    event.preventDefault();
    if (!this.busy()) this.cancelled.emit();
  }
}
