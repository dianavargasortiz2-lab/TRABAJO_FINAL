import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Product } from '../models/domain.models';

const STORAGE_KEY = 'asadero-cart-v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.readCart());
  readonly items$ = this.itemsSubject.asObservable();

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  get count(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  }

  add(product: Product): void {
    const current = this.items;
    const existing = current.find((item) => item.product.id === product.id);
    this.save(
      existing
        ? current.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, { product, quantity: 1 }],
    );
  }

  changeQuantity(productId: string, delta: number): void {
    this.save(
      this.items
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  remove(productId: string): void {
    this.save(this.items.filter((item) => item.product.id !== productId));
  }

  clear(): void {
    this.save([]);
  }

  refreshProducts(products: Product[]): void {
    const byId = new Map(products.map((product) => [product.id, product]));
    this.save(
      this.items.map((item) => ({
        ...item,
        product: byId.get(item.product.id) ?? item.product,
      })),
    );
  }

  private save(items: CartItem[]): void {
    this.itemsSubject.next(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private readCart(): CartItem[] {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value ? (JSON.parse(value) as CartItem[]) : [];
    } catch (error) {
      console.error('No se pudo recuperar el carrito guardado.', error);
      return [];
    }
  }
}
