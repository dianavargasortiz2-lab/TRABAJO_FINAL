import { Routes } from '@angular/router';
import { SiteLayoutComponent } from './components/site-layout/site-layout.component';
import { HomeComponent } from './components/home/home.component';
import { MenuComponent } from './components/menu/menu.component';
import { TeamComponent } from './components/team/team.component';
import { JoinComponent } from './components/join/join.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { TrackOrderComponent } from './components/track-order/track-order.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: SiteLayoutComponent,
    children: [
      { path: '', component: HomeComponent, title: 'Inicio — Asadero Con Afán' },
      { path: 'menu', component: MenuComponent, title: 'Menú — Asadero Con Afán' },
      { path: 'equipo', component: TeamComponent, title: 'Nuestro equipo — Asadero Con Afán' },
      { path: 'unete', component: JoinComponent, title: 'Únete & Opiniones — Asadero Con Afán' },
      { path: 'checkout', component: CheckoutComponent, title: 'Finalizar pedido — Asadero Con Afán' },
      { path: 'seguimiento', component: TrackOrderComponent, title: 'Seguimiento — Asadero Con Afán' },
    ],
  },
  { path: 'admin/login', component: AdminLoginComponent, title: 'Acceso administrador — Asadero Con Afán' },
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [adminGuard],
    title: 'Administración — Asadero Con Afán',
  },
  { path: '**', redirectTo: '' },
];
