import { Component, input } from '@angular/core';
import { Product } from '../../models/product.model';
import { DatePipe } from '@angular/common';

@Component({
  imports: [DatePipe],
  selector: 'app-product-table',
  styleUrl: './product-table.scss',
  templateUrl: './product-table.html',
})
export class ProductTable {
  readonly products = input.required<Product[]>();
}
