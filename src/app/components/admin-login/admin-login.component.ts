import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
})
export class AdminLoginComponent {
  mode: 'login' | 'recover' | 'reset' = 'login';
  readonly message = signal('');
  readonly error = signal('');
  readonly busy = signal(false);
  private readonly resetToken: string | null;
  readonly loginForm;
  readonly recoverForm;
  readonly resetForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    route: ActivatedRoute,
  ) {
    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.recoverForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.resetForm = this.fb.nonNullable.group({
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
    this.resetToken = route.snapshot.queryParamMap.get('reset');
    if (this.resetToken) this.mode = 'reset';
  }

  login(): void {
    this.message.set('');
    this.error.set('');
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    const { email, password } = this.loginForm.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigate(['/admin']),
      error: (error: unknown) => this.fail(error, 'No se pudo iniciar sesión.'),
    });
  }

  recover(): void {
    this.message.set('');
    this.error.set('');
    if (this.recoverForm.invalid) {
      this.recoverForm.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.auth.recoverPassword(this.recoverForm.controls.email.value).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.busy.set(false);
      },
      error: (error: unknown) => this.fail(error, 'No se pudo solicitar la recuperación.'),
    });
  }

  resetPassword(): void {
    this.message.set('');
    this.error.set('');
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const { password, confirmPassword } = this.resetForm.getRawValue();
    if (password !== confirmPassword || !this.resetToken) {
      this.error.set('Las contraseñas deben coincidir y el enlace debe ser válido.');
      return;
    }
    this.busy.set(true);
    this.auth.resetPassword(this.resetToken, password).subscribe({
      next: (response) => {
        this.mode = 'login';
        this.message.set(response.message);
        this.busy.set(false);
        void this.router.navigate(['/admin/login']);
      },
      error: (error: unknown) => this.fail(error, 'No se pudo cambiar la contraseña.'),
    });
  }

  private fail(error: unknown, fallback: string): void {
    this.error.set(
      error instanceof HttpErrorResponse
        ? error.error?.message ?? fallback
        : fallback,
    );
    this.busy.set(false);
  }
}
