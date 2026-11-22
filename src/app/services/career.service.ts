import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { JobApplication, Opinion, Vacancy } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class CareerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getVacancies(): Observable<Vacancy[]> {
    return this.http.get<Vacancy[]>(`${this.baseUrl}/vacancies`);
  }

  apply(form: FormData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/applications`,
      form,
    );
  }

  getOpinions(): Observable<Opinion[]> {
    return this.http.get<Opinion[]>(`${this.baseUrl}/opinions`);
  }

  submitOpinion(opinion: Omit<Opinion, '_id' | 'createdAt'>): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/opinions`,
      opinion,
    );
  }

  adminApplications(vacancy?: string): Observable<JobApplication[]> {
    const url = vacancy
      ? `${this.baseUrl}/admin/applications?vacancy=${encodeURIComponent(vacancy)}`
      : `${this.baseUrl}/admin/applications`;
    return this.http.get<JobApplication[]>(url);
  }

  downloadResume(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/admin/applications/${id}/resume`, {
      responseType: 'blob',
    });
  }

  markApplicationReviewed(id: string): Observable<JobApplication> {
    return this.http.patch<JobApplication>(`/api/admin/applications/${id}`, {
      revisada: true,
    });
  }

  adminVacancies(): Observable<Vacancy[]> {
    return this.http.get<Vacancy[]>(`${this.baseUrl}/admin/vacancies`);
  }

  saveVacancy(vacancy: Partial<Vacancy> & { cargo: string }): Observable<Vacancy> {
    return vacancy._id
      ? this.http.put<Vacancy>(
          `${this.baseUrl}/admin/vacancies/${vacancy._id}`,
          vacancy,
        )
      : this.http.post<Vacancy>(`${this.baseUrl}/admin/vacancies`, vacancy);
  }

  updateVacancy(id: string, patch: Partial<Vacancy>): Observable<Vacancy> {
    return this.http.patch<Vacancy>(`${this.baseUrl}/admin/vacancies/${id}`, patch);
  }

  deleteVacancy(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/vacancies/${id}`);
  }
}
