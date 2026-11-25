import { CurrencyPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { apiUrl } from '../../services/api-url';
import { DeliveryDetails, Order } from '../../models/domain.models';
import { WHATSAPP_NUMBER } from '../../data/business-contact';

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
  readonly deliveryFee = signal<number | null>(null);
  readonly configNotice = signal('');
  readonly submitError = signal('');
  readonly submitting = signal(false);
  readonly order = signal<Order | null>(null);
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
    this.http.get<StoreConfig>(apiUrl('/api/store-config')).subscribe({
      next: (config) => {
        this.deliveryFee.set(config.deliveryFee);
        if (config.deliveryFee === null) this.configNotice.set('El costo del domicilio se confirmará contigo antes de preparar el pedido.');
      },
      error: () => {
        this.configNotice.set('No se pudo consultar el costo del domicilio; podrás enviar el pedido y se confirmará contigo.');
      },
    });
  }

  get total(): number | null {
    const deliveryFee = this.deliveryFee();
    return deliveryFee === null
      ? null
      : this.cart.subtotal + deliveryFee;
  }

  submit(): void {
    this.submitError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.cart.items.length) {
      this.submitError.set('El carrito está vacío.');
      return;
    }
    this.submitting.set(true);
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
          this.order.set(order);
          this.cart.clear();
          this.submitting.set(false);
        },
        error: (error: unknown) => {
          this.submitError.set(
            error instanceof HttpErrorResponse
              ? error.error?.message ?? 'No se pudo registrar el pedido. Intenta nuevamente.'
              : 'No se pudo registrar el pedido. Intenta nuevamente.',
          );
          this.submitting.set(false);
        },
      });
  }

  whatsappLink(order: Order): string {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, mi pedido es ${order.numeroOrden}`)}`;
  }
}
