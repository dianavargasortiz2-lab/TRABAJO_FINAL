import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { CareerService } from '../../services/career.service';
import { OrderService } from '../../services/order.service';
import { JobApplication, Opinion, Order, OrderStatus, Vacancy } from '../../models/domain.models';

type AdminTab = 'resumen' | 'pedidos' | 'vacantes' | 'postulaciones' | 'opiniones';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-panel.component.html',
})
export class AdminPanelComponent implements OnInit {
  tab: AdminTab = 'resumen';
  orders: Order[] = [];
  vacancies: Vacancy[] = [];
  applications: JobApplication[] = [];
  opinions: Opinion[] = [];
  selectedVacancy = '';
  message = '';
  error = '';
  editingVacancy: Vacancy | null = null;
  showVacancyForm = false;
  readonly states: OrderStatus[] = ['Recibido', 'En preparación', 'En camino', 'Entregado'];
  readonly vacancyForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly ordersApi: OrderService,
    private readonly careers: CareerService,
    private readonly adminApi: AdminService,
  ) {
    this.vacancyForm = this.fb.nonNullable.group({
      cargo: ['', Validators.required],
      jornada: ['Tiempo completo', Validators.required],
      ubicacion: ['Neiva, Huila', Validators.required],
      requisitos: [''],
      descripcion: ['', Validators.required],
      activa: [true],
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loadOrders();
    this.loadVacancies();
    this.loadApplications();
    this.loadOpinions();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }

  setTab(tab: AdminTab): void {
    this.tab = tab;
    this.message = '';
    this.error = '';
  }

  changeOrderStatus(order: Order, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as OrderStatus;
    if (!order._id || !this.states.includes(status)) return;
    this.ordersApi.updateOrderStatus(order._id, status).subscribe({
      next: () => {
        this.message = `El pedido ${order.numeroOrden} se actualizó a ${status}.`;
        this.loadOrders();
      },
      error: (error: unknown) => this.showError(error, 'No se pudo actualizar el pedido.'),
    });
  }

  openVacancy(vacancy?: Vacancy): void {
    this.editingVacancy = vacancy ?? null;
    this.showVacancyForm = true;
    this.vacancyForm.reset({
      cargo: vacancy?.cargo ?? '',
      jornada: vacancy?.jornada ?? 'Tiempo completo',
      ubicacion: vacancy?.ubicacion ?? 'Neiva, Huila',
      requisitos: vacancy?.requisitos.join('\n') ?? '',
      descripcion: vacancy?.descripcion ?? '',
      activa: vacancy?.activa ?? true,
    });
  }

  saveVacancy(): void {
    if (this.vacancyForm.invalid) {
      this.vacancyForm.markAllAsTouched();
      return;
    }
    const form = this.vacancyForm.getRawValue();
    const vacancy = {
      ...form,
      requisitos: form.requisitos.split('\n').map((item) => item.trim()).filter(Boolean),
      ...(this.editingVacancy ? { _id: this.editingVacancy._id } : {}),
    };
    this.careers.saveVacancy(vacancy).subscribe({
      next: () => {
        this.showVacancyForm = false;
        this.message = 'Vacante guardada.';
        this.loadVacancies();
      },
      error: (error: unknown) => this.showError(error, 'No se pudo guardar la vacante.'),
    });
  }

  toggleVacancy(vacancy: Vacancy): void {
    this.careers.updateVacancy(vacancy._id, { activa: !vacancy.activa }).subscribe({
      next: () => this.loadVacancies(),
      error: (error: unknown) => this.showError(error, 'No se pudo actualizar la vacante.'),
    });
  }

  deleteVacancy(vacancy: Vacancy): void {
    if (!window.confirm(`¿Eliminar la vacante “${vacancy.cargo}”?`)) return;
    this.careers.deleteVacancy(vacancy._id).subscribe({
      next: () => {
        this.message = 'Vacante eliminada.';
        this.loadVacancies();
      },
      error: (error: unknown) => this.showError(error, 'No se pudo eliminar la vacante.'),
    });
  }

  filterApplications(): void {
    this.loadApplications();
  }

  downloadResume(application: JobApplication): void {
    this.careers.downloadResume(application._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${application.nombre.replace(/[^a-zA-Z0-9_-]/g, '_')}-hoja-de-vida.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => this.showError(error, 'No se pudo descargar la hoja de vida.'),
    });
  }

  markReviewed(application: JobApplication): void {
    this.careers.markApplicationReviewed(application._id).subscribe({
      next: () => this.loadApplications(),
      error: (error: unknown) => this.showError(error, 'No se pudo actualizar la postulación.'),
    });
  }

  approveOpinion(opinion: Opinion): void {
    if (!opinion._id) return;
    this.adminApi.approveOpinion(opinion._id).subscribe({
      next: () => {
        this.message = 'Opinión aprobada.';
        this.loadOpinions();
      },
      error: (error: unknown) => this.showError(error, 'No se pudo aprobar la opinión.'),
    });
  }

  deleteOpinion(opinion: Opinion): void {
    if (!opinion._id || !window.confirm('¿Eliminar esta opinión?')) return;
    this.adminApi.deleteOpinion(opinion._id).subscribe({
      next: () => {
        this.message = 'Opinión eliminada.';
        this.loadOpinions();
      },
      error: (error: unknown) => this.showError(error, 'No se pudo eliminar la opinión.'),
    });
  }

  vacancyName(application: JobApplication): string {
    return typeof application.vacante === 'string'
      ? application.vacante
      : application.vacante.cargo;
  }

  private loadOrders(): void {
    this.ordersApi.getAdminOrders().subscribe({
      next: (orders) => (this.orders = orders),
      error: (error: unknown) => this.showError(error, 'No se pudieron cargar los pedidos.'),
    });
  }

  private loadVacancies(): void {
    this.careers.adminVacancies().subscribe({
      next: (vacancies) => (this.vacancies = vacancies),
      error: (error: unknown) => this.showError(error, 'No se pudieron cargar las vacantes.'),
    });
  }

  private loadApplications(): void {
    this.careers.adminApplications(this.selectedVacancy || undefined).subscribe({
      next: (applications) => (this.applications = applications),
      error: (error: unknown) => this.showError(error, 'No se pudieron cargar las postulaciones.'),
    });
  }

  private loadOpinions(): void {
    this.adminApi.getOpinions().subscribe({
      next: (opinions) => (this.opinions = opinions),
      error: (error: unknown) => this.showError(error, 'No se pudieron cargar las opiniones.'),
    });
  }

  private showError(error: unknown, fallback: string): void {
    this.error =
      error instanceof HttpErrorResponse
        ? error.error?.message ?? fallback
        : fallback;
  }
}
