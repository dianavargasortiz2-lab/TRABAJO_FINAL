import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DeliveryDetails, Order, OrderStatus } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  createOrder(payload: {
    cliente: DeliveryDetails;
    productos: { productId: string; quantity: number }[];
  }): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, payload);
  }

  trackOrder(numeroOrden: string, telefono: string): Observable<Order> {
    return this.http.get<Order>(
      `${this.baseUrl}/orders/${encodeURIComponent(numeroOrden)}`,
      { params: { telefono } },
    );
  }

  getAdminOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/admin/orders`);
  }

  updateOrderStatus(id: string, estado: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/admin/orders/${id}`, {
      estado,
    });
  }
}
