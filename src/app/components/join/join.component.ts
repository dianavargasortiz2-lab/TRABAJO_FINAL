import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { CareerService } from '../../services/career.service';
import { INITIAL_VACANCIES } from '../../data/catalog';
import { Opinion, Vacancy } from '../../models/domain.models';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './join.component.html',
})
export class JoinComponent implements OnInit {
  readonly vacancies = signal<Vacancy[]>(INITIAL_VACANCIES);
  readonly opinions = signal<Opinion[]>([]);
  selectedFile: File | null = null;
  readonly applicationMessage = signal('');
  readonly applicationError = signal('');
  readonly opinionMessage = signal('');
  readonly opinionError = signal('');
  readonly vacancyNotice = signal('');
  readonly submittingApplication = signal(false);
  readonly submittingOpinion = signal(false);

  readonly applicationForm;
  readonly opinionForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly careers: CareerService,
  ) {
    this.applicationForm = this.fb.nonNullable.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[+0-9()\s-]{7,20}$/)]],
      vacante: ['', Validators.required],
      disponibilidad: [''],
      experiencia: [''],
      motivacion: [''],
      edad: [null as number | null],
      experienciaCaja: [''],
      experienciaDomicilios: [''],
      moto: [''],
      reqMoto: [false],
      reqLicencia: [false],
      reqCalles: [false],
    });
    this.opinionForm = this.fb.nonNullable.group({
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      plato: ['', Validators.maxLength(80)],
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comentario: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  get isCourier(): boolean {
    const id = this.applicationForm.controls.vacante.value;
    return this.vacancies().find((vacancy) => vacancy._id === id)?.cargo
      .toLocaleLowerCase('es')
      .includes('repartidor') ?? false;
  }

  ngOnInit(): void {
    this.careers.getVacancies().subscribe({
      next: (vacancies) => {
        this.vacancies.set(vacancies.filter((vacancy) => vacancy.activa));
        this.vacancyNotice.set('');
      },
      error: (error: unknown) => {
        this.vacancyNotice.set(this.errorMessage(
          error,
          'No se pudo consultar la API; se muestran las vacantes originales del sitio.',
        ));
      },
    });
    this.careers.getOpinions().subscribe({
      next: (opinions) => this.opinions.set(opinions),
      error: (error: unknown) => {
        this.opinionError.set(this.errorMessage(error, 'No se pudieron cargar las opiniones.'));
      },
    });
  }

  selectVacancy(vacancy: Vacancy): void {
    this.applicationForm.controls.vacante.setValue(vacancy._id);
    document.getElementById('formulario-postulacion')?.scrollIntoView({ behavior: 'smooth' });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.applicationError.set('');
    this.selectedFile = null;
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      this.applicationError.set('La hoja de vida debe estar en formato PDF.');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.applicationError.set('El archivo no puede superar 5 MB.');
      input.value = '';
      return;
    }
    this.selectedFile = file;
  }

  submitApplication(): void {
    this.applicationMessage.set('');
    this.applicationError.set('');
    if (this.applicationForm.invalid || !this.selectedFile) {
      this.applicationForm.markAllAsTouched();
      if (!this.selectedFile) this.applicationError.set('Adjunta tu hoja de vida en PDF (máximo 5 MB).');
      return;
    }
    if (
      this.isCourier &&
      (!this.applicationForm.controls.reqMoto.value ||
        !this.applicationForm.controls.reqLicencia.value ||
        !this.applicationForm.controls.reqCalles.value)
    ) {
      this.applicationError.set('Confirma que tienes moto propia, licencia vigente y conoces las calles de Neiva.');
      return;
    }
    if (!this.isCourier && !this.applicationForm.controls.motivacion.value.trim()) {
      this.applicationError.set('Cuéntanos por qué quieres trabajar con nosotros.');
      return;
    }
    const data = new FormData();
    Object.entries(this.applicationForm.getRawValue()).forEach(([key, value]) => {
      if (value !== null) data.append(key, String(value));
    });
    data.append('cv', this.selectedFile);
    this.submittingApplication.set(true);
    this.careers.apply(data).subscribe({
      next: (response) => {
        this.applicationMessage.set(response.message);
        this.applicationForm.reset();
        this.selectedFile = null;
        this.submittingApplication.set(false);
      },
      error: (error: unknown) => {
        this.applicationError.set(this.errorMessage(error, 'No se pudo enviar la postulación.'));
        this.submittingApplication.set(false);
      },
    });
  }

  submitOpinion(): void {
    this.opinionMessage.set('');
    this.opinionError.set('');
    if (this.opinionForm.invalid) {
      this.opinionForm.markAllAsTouched();
      return;
    }
    this.submittingOpinion.set(true);
    this.careers.submitOpinion(this.opinionForm.getRawValue()).subscribe({
      next: (response) => {
        this.opinionMessage.set(response.message);
        this.opinionForm.reset({ nombre: '', plato: '', rating: 0, comentario: '' });
        this.submittingOpinion.set(false);
      },
      error: (error: unknown) => {
        this.opinionError.set(this.errorMessage(error, 'No se pudo enviar la opinión.'));
        this.submittingOpinion.set(false);
      },
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse
      ? error.error?.message ?? error.error?.error ?? fallback
      : fallback;
  }

  get averageRating(): string {
    const opinions = this.opinions();
    if (!opinions.length) return '0.0';
    const average =
      opinions.reduce((sum, opinion) => sum + opinion.rating, 0) /
      opinions.length;
    return average.toFixed(1);
  }
}
