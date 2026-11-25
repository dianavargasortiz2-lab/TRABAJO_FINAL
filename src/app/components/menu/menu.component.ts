import { Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CatalogService } from '../../services/catalog.service';
import { CATEGORIES, PRODUCTS } from '../../data/catalog';
import { WHATSAPP_NUMBER } from '../../data/business-contact';
import { Product } from '../../models/domain.models';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './menu.component.html',
})
export class MenuComponent implements OnInit {
  readonly products = signal<Product[]>(PRODUCTS);
  readonly categories = CATEGORIES;
  readonly category = signal<string>('Todas');
  readonly search = signal('');
  readonly catalogNotice = signal('');
  readonly visibleProducts = computed(() => {
    const category = this.category();
    const query = this.search().trim().toLocaleLowerCase('es');
    return this.products().filter((product) => {
      const matchesCategory =
        category === 'Todas' || product.category === category;
      const matchesSearch =
        !query ||
        `${product.name} ${product.description}`.toLocaleLowerCase('es').includes(query);
      return matchesCategory && matchesSearch;
    });
  });
  notice = '';

  constructor(
    readonly cart: CartService,
    private readonly catalog: CatalogService,
  ) {}

  ngOnInit(): void {
    this.catalog.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.cart.refreshProducts(products);
        this.catalogNotice.set('');
      },
      error: () => {
        this.catalogNotice.set(
          'No se pudo conectar con el catálogo de MongoDB; se muestran los productos guardados del sitio.',
        );
      },
    });
  }

  add(product: Product): void {
    this.cart.add(product);
    this.notice = `${product.name} se agregó al carrito.`;
    setTimeout(() => (this.notice = ''), 2400);
  }

  whatsappLink(product: Product): string {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, quiero pedir ${product.name}`)}`;
  }
}
