import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/product-list/product-list').then((m) => m.ProductList),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('../pages/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('../pages/product-form/product-form').then((m) => m.ProductForm),
  }
];
