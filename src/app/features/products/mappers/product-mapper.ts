import { toCalendarDate } from '../utils/calendar-date';
import { ProductDto } from '../models/product.dto';
import { Product } from '../models/product.model';

export class ProductMapper {
  static toProduct(productDto: ProductDto): Product {
    return {
      id: productDto.id,
      name: productDto.name,
      description: productDto.description,
      logo: productDto.logo,
      dateRelease: toCalendarDate(productDto.date_release),
      dateRevision: toCalendarDate(productDto.date_revision),
    };
  }

  static toProductDto(product: Product): ProductDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      logo: product.logo,
      date_release: toCalendarDate(product.dateRelease),
      date_revision: toCalendarDate(product.dateRevision),
    };
  }
}
