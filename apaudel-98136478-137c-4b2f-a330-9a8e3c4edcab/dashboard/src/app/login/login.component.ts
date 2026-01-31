import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        
        // More detailed error messages
        if (error.status === 0 || error.status === undefined) {
          this.errorMessage = 'Cannot connect to server. Please make sure the API is running on http://localhost:3000';
        } else if (error.status === 401) {
          this.errorMessage = error.error?.message || 'Invalid email or password. Please try again.';
        } else if (error.status === 404) {
          this.errorMessage = 'API endpoint not found. Please check if the backend is running.';
        } else {
          this.errorMessage = error.error?.message || `Login failed (${error.status}). Please try again.`;
        }
      }
    });
  }
}