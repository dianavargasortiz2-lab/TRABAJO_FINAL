import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AdminUser } from '../models/domain.models';
import { apiUrl } from './api-url';

interface LoginResponse {
  token: string;
  user: AdminUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'asadero-admin-token';

  get token(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  get isAuthenticated(): boolean {
    return this.token !== null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(apiUrl('/api/auth/login'), { email, password })
      .pipe(tap((response) => sessionStorage.setItem(this.tokenKey, response.token)));
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
  }

  recoverPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(apiUrl('/api/auth/forgot-password'), {
      email,
    });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(apiUrl('/api/auth/reset-password'), {
      token,
      password,
    });
  }
}
