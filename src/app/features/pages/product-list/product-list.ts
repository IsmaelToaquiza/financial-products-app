import { Component, computed, DestroyRef, signal } from '@angular/core';
import { ProductsApi } from '../../products/services/products-api.service';
import { Product } from '../../products/models/product.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductTable } from '../../products/components/product-table/product-table';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';
import { RouterLink } from '@angular/router';

@Component({
  imports: [ProductTable, LoadingSkeleton, RouterLink],
  selector: 'app-product-list',
  styleUrl: './product-list.scss',
  templateUrl: './product-list.html',
})
export class ProductList {
  constructor(
    private readonly productsApi: ProductsApi,
    private readonly destroyRef: DestroyRef,
  ) {
    this.loadProducts();
  }

  readonly products = signal<Product[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal<string>('');
  readonly pageSize = signal<5 | 10 | 20>(5);

  readonly filteredProducts = computed(() => {
    const query = this.searchTerm().toLowerCase();
    if (!query) return this.products();

    return this.products().filter(
      (product) =>
        product.name.trim().toLowerCase().includes(query) ||
        product.description.trim().toLowerCase().includes(query),
    );
  });

  readonly visibleProducts = computed(() => this.filteredProducts().slice(0, this.pageSize()));

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productsApi
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products: Product[]) => {
          this.products.set(products);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load products');
          this.loading.set(false);
        },
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);

    if (value === 5 || value === 10 || value === 20) {
      this.pageSize.set(value as 5 | 10 | 20);
    }
  }
}
