import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProductMapper } from '../mappers/product-mapper';
import { ProductsResponseDto } from '../models/product.dto';
import { Product } from '../models/product.model';

@Service()
export class ProductsApi {
  private readonly http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<ProductsResponseDto>('/bp/products').pipe(
      map((response: ProductsResponseDto) => {
        const products = response.data.map(ProductMapper.toProduct);
        return products ;
      })
    );
  }
}
