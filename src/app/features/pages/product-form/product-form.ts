import { revisionDateFor } from '../../products/utils/calendar-date';
import { Product } from '../../products/models/product.model';
import { httpErrorMessage } from '../../../core/interceptors/error.interceptor';
import { FeedbackMessage } from '../../../shared/components/feedback-message/feedback-message';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControlStatus,
} from '@angular/forms';
import { ProductValidators } from '../../products/validators/product.validators';
import { ProductsApi } from '../../products/services/products-api.service';
import { ProductMapper } from '../../products/mappers/product-mapper';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  finalize,
  map,
  Observable,
  skip,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
@Component({
  imports: [ReactiveFormsModule, RouterLink, FeedbackMessage, FaIconComponent],
  selector: 'app-product-form',
  styleUrl: './product-form.scss',
  templateUrl: './product-form.html',
})
export class ProductForm {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  readonly backIcon = faArrowLeft;
  editingId = this.route.snapshot.paramMap.get('id');
  readonly loading = signal(false);
  readonly productLoaded = signal(false);
  private initialValue: ReturnType<ProductForm['productForm']['getRawValue']> | undefined;
  private readonly fieldLabels = {
    id: 'El ID',
    name: 'El nombre',
    description: 'La descripción',
    logo: 'El logo',
    dateRelease: 'La fecha de liberación',
    dateRevision: 'La fecha de reestructuración',
  };
  readonly formStatus = signal<FormControlStatus>('INVALID');
  readonly productForm: FormGroup<{
    id: FormControl<string>;
    name: FormControl<string>;
    description: FormControl<string>;
    logo: FormControl<string>;
    dateRelease: FormControl<string>;
    dateRevision: FormControl<string>;
  }>;

  readonly saving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly fb: FormBuilder,
    private readonly productValidators: ProductValidators,
    private readonly productsApi: ProductsApi,
  ) {
    this.productForm = this.fb.nonNullable.group(
      {
        id: [
          '',
          {
            validators: [Validators.required, Validators.minLength(3), Validators.maxLength(10)],
            asyncValidators: this.editingId ? [] : [this.productValidators.uniqueProductId()],
            updateOn: 'change',
          },
        ],
        name: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
        description: [
          '',
          [Validators.required, Validators.minLength(10), Validators.maxLength(200)],
        ],
        logo: ['', [Validators.required]],
        dateRelease: [
          '',
          [
            Validators.required,
            ProductValidators.releaseDateNotPast(() => this.initialValue?.dateRelease),
          ],
        ],
        dateRevision: ['', [Validators.required]],
      },
      { validators: [ProductValidators.revisionDateYearLater()] },
    );

    this.productForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((status) => {
      this.formStatus.set(status);
    });
    this.productForm.controls.id.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const id = this.productForm.controls.id;
        if (id.enabled && value !== value.trim()) id.setValue(value.trim());
      });
    this.productForm.controls.dateRelease.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        let revision = '';
        if (value) {
          try {
            revision = revisionDateFor(value);
          } catch {
          }
        }
        this.productForm.controls.dateRevision.setValue(revision);
      });
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        switchMap((id) => this.loadProduct(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((product) => {
        this.initialValue = product;
        this.productForm.patchValue(product, { emitEvent: false });
        this.productForm.controls.id.disable();
        this.productForm.updateValueAndValidity();
        this.productLoaded.set(true);
      });
  }

  private loadProduct(id: string | null): Observable<Product> {
    this.editingId = id;
    this.initialValue = undefined;
    this.productLoaded.set(false);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.productForm.reset(undefined, { emitEvent: false });
    if (!id) return EMPTY;
    this.productForm.controls.id.disable({ emitEvent: false });
    this.loading.set(true);
    return this.productsApi.getProduct(id).pipe(
      catchError((error: unknown) => {
        this.errorMessage.set(
          httpErrorMessage(
            error,
            'No se pudo cargar el producto. Vuelve al listado e inténtalo nuevamente.',
          ),
        );
        return EMPTY;
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  fieldError(field: keyof ProductForm['productForm']['controls']): string | null {
    this.formStatus();
    const control = this.productForm.controls[field];
    if (!control.touched || !control.errors) return null;
    const label = this.fieldLabels[field];

    if (control.hasError('required')) return `${label} es obligatorio!`;
    if (control.hasError('minlength'))
      return `Debe tener al menos ${control.errors!['minlength'].requiredLength} caracteres.`;
    if (control.hasError('maxlength'))
      return `Debe tener como máximo ${control.errors!['maxlength'].requiredLength} caracteres.`;
    if (control.hasError('idTaken')) return 'Este ID ya existe.';
    if (control.hasError('verificationUnavailable'))
      return 'No se pudo verificar el ID. Pulsa Reintentar verificación.';
    if (control.hasError('invalidDate')) return 'Introduce una fecha válida.';
    if (control.hasError('datePast')) return 'La fecha no puede ser anterior a hoy.';
    return null;
  }

  onSubmit(): void {
    if (this.saving() || this.loading() || (this.editingId && !this.initialValue)) return;
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid || this.productForm.pending) {
      this.errorMessage.set(
        this.productForm.pending
          ? 'Espera a que termine la verificación del ID y vuelve a enviar.'
          : 'Revisa los campos indicados antes de enviar.',
      );
      return;
    }

    this.saving.set(true);

    const product = this.productForm.getRawValue();
    const productDto = ProductMapper.toProductDto(product);

    const request = this.editingId
      ? this.productsApi.updateProduct(this.editingId, productDto)
      : this.productsApi.createProduct(productDto);
    request
      .pipe(
        takeUntil(this.route.paramMap.pipe(skip(1))),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.successMessage.set(
            this.editingId
              ? 'Producto actualizado correctamente.'
              : 'Producto creado correctamente.',
          );
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            httpErrorMessage(
              error,
              error instanceof HttpErrorResponse && error.status === 400
                ? 'El servidor rechazó los datos. Verifica que el ID no exista, el nombre tenga entre 6 y 100 caracteres, la descripción entre 10 y 200, el logo no esté vacío y las fechas sean válidas.'
                : `No se pudo ${this.editingId ? 'actualizar' : 'crear'} el producto. Inténtalo nuevamente.`,
            ),
          );
        },
      });
  }

  retryIdVerification(): void {
    this.productForm.controls.id.updateValueAndValidity();
  }

  onReset(): void {
    if (this.saving() || this.loading() || (this.editingId && !this.initialValue)) return;
    this.productForm.reset(this.initialValue);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}
