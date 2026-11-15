import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-loading-skeleton',
  styleUrl: './loading-skeleton.scss',
  templateUrl: './loading-skeleton.html',
})
export class LoadingSkeleton {
  readonly rows = Array.from({ length: 5 }, (_, i) => i + 1);
}
