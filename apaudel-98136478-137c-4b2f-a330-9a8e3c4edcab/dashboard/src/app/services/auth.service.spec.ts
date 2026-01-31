import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should store token and user on login', () => {
    service.login('owner@acme.com', 'password123').subscribe((response) => {
      expect(response.access_token).toBe('token');
      expect(service.getToken()).toBe('token');
      expect(service.getCurrentUser()?.email).toBe('owner@acme.com');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      access_token: 'token',
      user: {
        id: 1,
        email: 'owner@acme.com',
        name: 'John Owner',
        role: 'Owner',
        organizationId: 1,
      },
    });
  });

  it('should clear token and user on logout', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ id: 1, email: 'owner@acme.com', role: 'Owner', organizationId: 1 }),
    );

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
  });
});
