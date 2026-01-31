import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';

describe('LoginComponent', () => {
  let routerNavigateSpy: ReturnType<typeof vi.spyOn> | undefined;
  let authService: AuthService;

  beforeEach(async () => {
    const authServiceMock = {
      login: vi.fn(),
    } as Partial<AuthService> as AuthService;

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter([]),
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    routerNavigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true as any);
  });

  it('should show validation error if email or password is missing', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.email = '';
    component.password = '';

    component.onSubmit();

    expect(component.errorMessage).toBe('Please enter email and password');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call AuthService.login and navigate on success', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.email = 'owner@acme.com';
    component.password = 'password123';

    (authService.login as any).mockReturnValue(of({ access_token: 'token', user: {} as any }));

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('owner@acme.com', 'password123');
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show server connection error when status is 0', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.email = 'owner@acme.com';
    component.password = 'password123';

    (authService.login as any).mockReturnValue(
      throwError(() => ({
        status: 0,
      })),
    );

    component.onSubmit();

    expect(component.errorMessage).toContain('Cannot connect to server');
  });

  it('should show invalid credentials message on 401', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.email = 'owner@acme.com';
    component.password = 'wrong';

    (authService.login as any).mockReturnValue(
      throwError(() => ({
        status: 401,
        error: { message: 'Invalid credentials' },
      })),
    );

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid credentials');
  });
});

