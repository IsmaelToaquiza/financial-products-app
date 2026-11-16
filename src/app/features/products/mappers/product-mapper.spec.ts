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
      dateRelease: '2023-01-01',
      dateRevision: '2023-02-01',
    });
  });

  it('should map Product to ProductDto', () => {
    const product = {
      id: 'uno',
      name: 'Product 1',
      description: 'Description 1',
      logo: 'logo1.png',
      dateRelease: '2023-01-01',
      dateRevision: '2023-02-01',
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
  it('normalizes ISO timestamps at the API boundary without shifting the calendar day', () => {
    const dto = {
      id: 'abc',
      name: 'Producto',
      description: 'Descripción válida',
      logo: 'logo.png',
      date_release: '2090-01-15T00:00:00+14:00',
      date_revision: '2091-01-15T00:00:00Z',
    };
    expect(ProductMapper.toProduct(dto)).toEqual(
      expect.objectContaining({ dateRelease: '2090-01-15', dateRevision: '2091-01-15' }),
    );
  });
});
