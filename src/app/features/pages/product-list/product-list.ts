import { httpErrorMessage } from '../../../core/interceptors/error.interceptor';
import { FeedbackMessage } from '../../../shared/components/feedback-message/feedback-message';
import { Component, computed, DestroyRef, signal } from '@angular/core';
import { ProductsApi } from '../../products/services/products-api.service';
import { Product } from '../../products/models/product.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductTable } from '../../products/components/product-table/product-table';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton';
import { DeleteDialog } from '../../products/components/delete-dialog/delete-dialog';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  imports: [ProductTable, LoadingSkeleton, RouterLink, DeleteDialog, FeedbackMessage],
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

  readonly selectedProduct = signal<Product | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  selectForDeletion(product: Product): void {
    this.deleteError.set(null);
    this.selectedProduct.set(product);
  }

  cancelDeletion(): void {
    if (!this.deleting()) this.selectedProduct.set(null);
  }

  confirmDeletion(): void {
    const product = this.selectedProduct();
    if (!product || this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    this.productsApi
      .deleteProduct(product.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deleting.set(false)),
      )
      .subscribe({
        next: () => {
          this.products.update((products) => products.filter((item) => item.id !== product.id));
          this.selectedProduct.set(null);
        },
        error: (error: unknown) =>
          this.deleteError.set(
            httpErrorMessage(error, 'No se pudo eliminar el producto. Inténtalo nuevamente.'),
          ),
      });
  }

  readonly products = signal<Product[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal<string>('');
  readonly pageSize = signal<5 | 10 | 20>(5);

  readonly filteredProducts = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
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
        error: (error: unknown) => {
          this.error.set(httpErrorMessage(error, 'No se pudieron cargar los productos.'));
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
