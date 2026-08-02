import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AppLogoComponent } from '../../../shared/components/app-logo.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, AppLogoComponent],
  template: `
    <main class="login-page"><section class="login-card"><app-logo /><div class="intro"><span class="kicker">WELCOME BACK</span><h1>Sign in to your workspace</h1><p>Keep your projects moving with a clear view of the work that matters.</p></div><form [formGroup]="form" (ngSubmit)="submit()"><label for="email">Email</label><input id="email" type="email" pInputText formControlName="email" autocomplete="email" placeholder="you@company.com" /><small class="field-error" *ngIf="form.controls.email.invalid && form.controls.email.touched">Enter a valid email address.</small><label for="password">Password</label><p-password inputId="password" formControlName="password" [feedback]="false" [toggleMask]="true" autocomplete="current-password" placeholder="Your password" /><small class="field-error" *ngIf="form.controls.password.invalid && form.controls.password.touched">Password is required.</small><div class="login-error" *ngIf="errorMessage"><i class="pi pi-exclamation-circle"></i><span>{{ errorMessage }}</span></div><p-button type="submit" label="Sign in" [loading]="loading" styleClass="submit-button" /></form><p class="demo-hint">Demo account: admin&#64;agiletaskhub.local</p></section></main>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; background: radial-gradient(circle at top right, #eef2ff 0, #f8fafc 48%, #fff 100%); }.login-card { width: min(27rem, 100%); padding: 2.5rem; background: #fff; border: 1px solid #edf0f4; border-radius: 1rem; box-shadow: 0 20px 50px rgba(30, 41, 59, .08); }.intro { margin: 2.5rem 0 1.8rem; }.kicker { color: #6366f1; font-size: .68rem; font-weight: 700; letter-spacing: .12em; }.intro h1 { margin: .55rem 0 .45rem; color: #182230; font-size: 1.65rem; letter-spacing: -.04em; }.intro p { margin: 0; color: #98a2b3; font-size: .82rem; line-height: 1.55; }.login-card form { display: flex; flex-direction: column; gap: .45rem; }.login-card label { margin-top: .45rem; color: #344054; font-size: .8rem; font-weight: 600; }.login-card input, .login-card p-password { width: 100%; }.login-card :host ::ng-deep .p-password { display: flex; width: 100%; }.login-card :host ::ng-deep .p-password-input { width: 100%; }.field-error { color: #dc2626; font-size: .7rem; }.login-error { display: flex; align-items: center; gap: .45rem; padding: .7rem; margin-top: .6rem; border-radius: .45rem; color: #b42318; background: #fef3f2; font-size: .76rem; }.submit-button { width: 100%; margin-top: 1.1rem; }.demo-hint { margin: 1.3rem 0 0; color: #98a2b3; font-size: .7rem; text-align: center; }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  loading = false;
  errorMessage = '';

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.authService.login(this.form.getRawValue()).pipe(finalize(() => this.loading = false)).subscribe({
      next: () => void this.router.navigate(['/projects']),
      error: (error) => { this.errorMessage = error.status === 401 ? 'The email or password is incorrect.' : 'Unable to sign in right now. Please try again.'; }
    });
  }
}

