import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div (keydown)="handleKeydown($event)" tabindex="0" class="outline-none">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent implements OnInit {
  isDarkMode = false;

  ngOnInit(): void {
    const stored = localStorage.getItem('task_manager_theme');
    if (stored === 'dark') {
      this.enableDarkMode(true);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    // Ctrl+K toggles dark mode
    if (event.ctrlKey && (event.key === 'k' || event.key === 'K')) {
      event.preventDefault();
      this.toggleDarkMode();
    }
  }

  private toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.enableDarkMode(this.isDarkMode);
    localStorage.setItem('task_manager_theme', this.isDarkMode ? 'dark' : 'light');
  }

  private enableDarkMode(enable: boolean): void {
    const body = document.body;
    if (!body) return;
    if (enable) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  }
}