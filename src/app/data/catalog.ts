import { Product, ProductCategory, TeamMember, Vacancy } from '../models/domain.models';
import catalogData from '../../../shared/catalog.json';

export const PRODUCTS: Product[] = catalogData.products.map((product) => ({
  ...product,
  category: product.category as ProductCategory,
}));

export const CATEGORIES = ['Todas', ...catalogData.categories] as const;

export const TEAM: TeamMember[] = [
  {
    name: 'María García',
    role: 'Fundadora y administradora',
    story:
      'María fundó Asadero Con Afán hace [X] años con la receta de su abuela y las ganas de llevar sabor casero a toda Neiva. Su dedicación es la razón por la que cada pollo sabe a hogar.',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    name: 'Carlos Pérez',
    role: 'Chef principal — Maestro asador',
    story:
      'Con 10 años de experiencia en el arte del asado al carbón, Carlos conoce el punto exacto de cada pieza. Su secreto: paciencia, buena leña y mucho cariño.',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'Laura Díaz',
    role: 'Atención al cliente',
    story:
      'Laura es el primer rostro amable que verás al llegar. Lleva [X] años siendo el corazón del servicio al cliente del asadero, siempre con una sonrisa lista.',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
];

export const INITIAL_VACANCIES: Vacancy[] = catalogData.vacancies.map(
  ({ id, ...vacancy }) => ({ _id: id, ...vacancy }),
);
