import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Opinion } from '../models/domain.models';
import { apiUrl } from './api-url';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getOpinions(): Observable<Opinion[]> {
    return this.http.get<Opinion[]>(apiUrl('/api/admin/opinions'));
  }

  approveOpinion(id: string): Observable<Opinion> {
    return this.http.patch<Opinion>(apiUrl(`/api/admin/opinions/${id}`), {
      aprobada: true,
    });
  }

  deleteOpinion(id: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/admin/opinions/${id}`));
  }
}
