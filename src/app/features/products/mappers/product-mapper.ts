import { ProductDto } from "../models/product.dto";
import { Product } from "../models/product.model";

export class ProductMapper {

  static toProduct(productDto: ProductDto): Product {
    return {
      id: productDto.id,
      name: productDto.name,
      description: productDto.description,
      logo: productDto.logo,
      dateRelease: new Date(productDto.date_release),
      dateRevision: new Date(productDto.date_revision),
    };
  }

  static toProductDto(product: Product): ProductDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      logo: product.logo,
      date_release: product.dateRelease.toISOString().split('T')[0],
      date_revision: product.dateRevision.toISOString().split('T')[0],
    };
  }
}
