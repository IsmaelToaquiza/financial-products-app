import { inject, Service, InjectionToken } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProductMapper } from '../mappers/product-mapper';
import { ProductDto, ProductsResponseDto } from '../models/product.dto';
import { Product } from '../models/product.model';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/bp',
});

@Service()
export class ProductsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL).replace(/\/$/, '');

  getProducts(): Observable<Product[]> {
    return this.http.get<ProductsResponseDto>(`${this.baseUrl}/products`).pipe(
      map((response: ProductsResponseDto) => {
        const products = response.data.map(ProductMapper.toProduct);
        return products;
      }),
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.http
      .get<ProductDto>(`${this.baseUrl}/products/${encodeURIComponent(id)}`)
      .pipe(map(ProductMapper.toProduct));
  }

  verifyProductId(id: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.baseUrl}/products/verification/${encodeURIComponent(id)}`,
    );
  }

  createProduct(product: ProductDto): Observable<ProductDto> {
    return this.http
      .post<{ data: ProductDto }>(`${this.baseUrl}/products`, product)
      .pipe(map((response) => response.data));
  }

  updateProduct(id: string, product: ProductDto): Observable<ProductDto> {
    return this.http
      .put<{ data: ProductDto }>(`${this.baseUrl}/products/${encodeURIComponent(id)}`, product)
      .pipe(map((response) => response.data));
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/products/${encodeURIComponent(id)}`,
    );
  }
}
