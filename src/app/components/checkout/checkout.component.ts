import { CurrencyPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { DeliveryDetails, Order } from '../../models/domain.models';

interface StoreConfig {
  deliveryFee: number | null;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit {
  deliveryFee: number | null = null;
  configError = '';
  submitError = '';
  submitting = false;
  order: Order | null = null;
  readonly statuses = ['Recibido', 'En preparación', 'En camino', 'Entregado'];
  readonly form;

  constructor(
    readonly cart: CartService,
    private readonly http: HttpClient,
    private readonly fb: FormBuilder,
    private readonly orders: OrderService,
  ) {
    this.form = this.fb.nonNullable.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[+0-9()\s-]{7,20}$/)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      notas: [''],
      pago: ['Efectivo' as DeliveryDetails['pago'], Validators.required],
    });
  }

  ngOnInit(): void {
    this.http.get<StoreConfig>('/api/store-config').subscribe({
      next: (config) => {
        this.deliveryFee = config.deliveryFee;
        if (this.deliveryFee === null) {
          this.configError = 'El costo del domicilio aún no está configurado. No se realizará un cobro estimado.';
        }
      },
      error: () => {
        this.configError = 'No se pudo consultar la configuración de domicilios. Verifica que la API y MongoDB estén disponibles.';
      },
    });
  }

  get total(): number | null {
    return this.deliveryFee === null
      ? null
      : this.cart.subtotal + this.deliveryFee;
  }

  submit(): void {
    this.submitError = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.cart.items.length) {
      this.submitError = 'El carrito está vacío.';
      return;
    }
    if (this.deliveryFee === null) {
      this.submitError = 'No es posible confirmar el pedido hasta configurar el costo del domicilio.';
      return;
    }
    this.submitting = true;
    this.orders
      .createOrder({
        cliente: this.form.getRawValue(),
        productos: this.cart.items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
      })
      .subscribe({
        next: (order) => {
          this.order = order;
          this.cart.clear();
          this.submitting = false;
        },
        error: (error: unknown) => {
          this.submitError =
            error instanceof HttpErrorResponse
              ? error.error?.message ?? 'No se pudo registrar el pedido. Intenta nuevamente.'
              : 'No se pudo registrar el pedido. Intenta nuevamente.';
          this.submitting = false;
        },
      });
  }

  whatsappLink(order: Order): string {
    return `https://wa.me/573123256208?text=${encodeURIComponent(`Hola, mi pedido es ${order.numeroOrden}`)}`;
  }
}
