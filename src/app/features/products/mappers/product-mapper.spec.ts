import { ProductMapper } from './product-mapper';

describe('ProductMapper', () => {
  it('should create an instance', () => {
    expect(new ProductMapper()).toBeTruthy();
  });

  it('should map ProductDto to Product', () => {
    const productDto = {
      id: 'uno',
      name: 'Product 1',
      description: 'Description 1',
      logo: 'logo1.png',
      date_release: '2023-01-01',
      date_revision: '2023-02-01',
    };

    const product = ProductMapper.toProduct(productDto);

    expect(product).toEqual({
      id: 'uno',
      name: 'Product 1',
      description: 'Description 1',
      logo: 'logo1.png',
      dateRelease: new Date('2023-01-01'),
      dateRevision: new Date('2023-02-01'),
    });
  });

  it('should map Product to ProductDto', () => {
    const product = {
      id: 'uno',
      name: 'Product 1',
      description: 'Description 1',
      logo: 'logo1.png',
      dateRelease: new Date('2023-01-01'),
      dateRevision: new Date('2023-02-01'),
    };

    const productDto = ProductMapper.toProductDto(product);

    expect(productDto).toEqual({
      id: 'uno',
      name: 'Product 1',
      description: 'Description 1',
      logo: 'logo1.png',
      date_release: '2023-01-01',
      date_revision: '2023-02-01',
    });
  });
});
