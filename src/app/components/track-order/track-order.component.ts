import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/domain.models';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './track-order.component.html',
})
export class TrackOrderComponent {
  readonly statuses = ['Recibido', 'En preparación', 'En camino', 'Entregado'];
  readonly form;
  readonly order = signal<Order | null>(null);
  readonly error = signal('');

  constructor(
    private readonly fb: FormBuilder,
    private readonly orders: OrderService,
    route: ActivatedRoute,
  ) {
    this.form = this.fb.nonNullable.group({
      numeroOrden: [route.snapshot.queryParamMap.get('orden') ?? '', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^[+0-9()\s-]{7,20}$/)]],
    });
  }

  submit(): void {
    this.error.set('');
    this.order.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { numeroOrden, telefono } = this.form.getRawValue();
    this.orders.trackOrder(numeroOrden, telefono).subscribe({
      next: (order) => this.order.set(order),
      error: (error: unknown) => {
        this.error.set(
          error instanceof HttpErrorResponse
            ? error.error?.message ?? 'No se encontró el pedido con esos datos.'
            : 'No se encontró el pedido con esos datos.',
        );
      },
    });
  }

  whatsappLink(): string {
    const numero = this.order()?.numeroOrden ?? '';
    return `https://wa.me/573123256208?text=${encodeURIComponent(`Hola, consulto mi pedido ${numero}`)}`;
  }
}
