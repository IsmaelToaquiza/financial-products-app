import { Component, input } from '@angular/core';

@Component({
  selector: 'app-feedback-message',
  styleUrl: './feedback-message.scss',
  templateUrl: './feedback-message.html',
})
export class FeedbackMessage {
  readonly message = input<string | null>(null);
  readonly type = input<'success' | 'error' | 'info'>('info');
}
