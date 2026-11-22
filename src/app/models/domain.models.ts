export type ProductCategory =
  | 'Combos'
  | 'Pollos'
  | 'Acompañamientos'
  | 'Bebidas'
  | 'Postres';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image: string;
  rating?: number;
  startsAt?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TeamMember {
  name: string;
  role: string;
  story: string;
  image?: string;
}

export interface Vacancy {
  _id: string;
  cargo: string;
  jornada: string;
  ubicacion: string;
  requisitos: string[];
  descripcion: string;
  activa: boolean;
}

export interface Opinion {
  _id?: string;
  nombre: string;
  plato?: string;
  rating: number;
  comentario: string;
  aprobada?: boolean;
  createdAt?: string;
}

export type OrderStatus =
  | 'Recibido'
  | 'En preparación'
  | 'En camino'
  | 'Entregado';

export interface DeliveryDetails {
  nombre: string;
  telefono: string;
  direccion: string;
  notas?: string;
  pago: 'Efectivo' | 'Transferencia' | 'Tarjeta contraentrega';
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  _id?: string;
  numeroOrden: string;
  cliente: DeliveryDetails;
  productos: OrderItem[];
  subtotal: number;
  costoDomicilio: number;
  total: number;
  estado: OrderStatus;
  createdAt?: string;
  historial?: { estado: OrderStatus; fecha: string }[];
}

export interface JobApplication {
  _id: string;
  nombre: string;
  email: string;
  telefono: string;
  vacante: string | { _id: string; cargo: string };
  revisada: boolean;
  createdAt: string;
  respuestas?: Record<string, string>;
}

export interface AdminUser {
  email: string;
}
