import { Component, OnInit, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../services/auth.service';
import { TaskService, Task, CreateTaskDto } from '../services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private router = inject(Router);

  currentUser = this.authService.getCurrentUser();
  private successTimer?: number;
  private errorTimer?: number;

  // We keep the raw list around and derive the three columns from it
  allTasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  isLoadingTasks = false;
  isMutatingTask = false;
  errorMessage = '';
  successMessage = '';
  isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;

  showCreateModal = false;
  newTask: CreateTaskDto = {
    title: '',
    description: '',
    status: 'todo',
    category: 'Work',
    organizationId: this.currentUser?.organizationId || 1
  };

  filterCategory: string = 'all';
  searchQuery: string = '';
  sortOption: 'newest' | 'oldest' | 'title' = 'newest';

  get todoCount(): number {
    return this.todoTasks.length;
  }

  get inProgressCount(): number {
    return this.inProgressTasks.length;
  }

  get doneCount(): number {
    return this.doneTasks.length;
  }

  get isDarkMode(): boolean {
    return document.body?.classList.contains('dark-mode') ?? false;
  }

  get completionPercent(): number {
    const total = this.allTasks.length;
    if (total === 0) return 0;
    return Math.round((this.doneTasks.length / total) * 100);
  }

  get categorySummary(): { label: string; count: number }[] {
    const workCount = this.allTasks.filter((task) => task.category === 'Work').length;
    const personalCount = this.allTasks.filter((task) => task.category === 'Personal').length;
    return [
      { label: 'Work', count: workCount },
      { label: 'Personal', count: personalCount },
    ];
  }

  ngOnInit(): void {
    this.isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    this.loadTasks();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    if (this.isTypingInFormField(event)) {
      return;
    }

    // N => open new task modal (if allowed)
    if (!event.ctrlKey && !event.metaKey && (event.key === 'n' || event.key === 'N')) {
      event.preventDefault();
      if (this.canCreateTasks) {
        this.openCreateModal();
      }
      return;
    }

    // Ctrl/Cmd + K => toggle theme
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.toggleDarkMode();
      return;
    }

    // / => focus search
    if (!event.ctrlKey && !event.metaKey && event.key === '/') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  }

  @HostListener('window:online')
  handleOnline(): void {
    this.isOffline = false;
    this.setSuccess('You are back online.');
    this.loadTasks();
  }

  @HostListener('window:offline')
  handleOffline(): void {
    this.isOffline = true;
    this.setError('You appear to be offline. Changes will not be saved.');
  }

  loadTasks(): void {
    if (this.isOffline) {
      this.setError('Cannot load tasks while offline.');
      return;
    }

    this.isLoadingTasks = true;
    this.errorMessage = '';
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.allTasks = tasks;
        this.organizeTasks(this.allTasks);
        this.isLoadingTasks = false;
      },
      error: (error) => {
        console.error('Failed to load tasks:', error);
        this.setError(error?.error?.message ?? 'Could not load tasks. Please try again.');
        this.isLoadingTasks = false;
      }
    });
  }

  organizeTasks(tasks: Task[]): void {
    let filtered = tasks;

    // Filter by category
    if (this.filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === this.filterCategory);
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (this.sortOption === 'title') {
        return a.title.localeCompare(b.title);
      }

      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();

      if (this.sortOption === 'oldest') {
        return aDate - bDate;
      }

      // default: newest first
      return bDate - aDate;
    });

    this.todoTasks = sorted.filter(t => t.status === 'todo');
    this.inProgressTasks = sorted.filter(t => t.status === 'in-progress');
    this.doneTasks = sorted.filter(t => t.status === 'done');
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: Task['status']): void {
    if (this.isOffline) {
      this.setError('You are offline. Reconnect to update tasks.');
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const task = event.container.data[event.currentIndex];
      this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
        next: () => {
          // soft success; we don't need to refetch everything here
          this.setSuccess('Task status updated');
        },
        error: (error) => {
          console.error('Failed to update task:', error);
          this.setError(error?.error?.message ?? 'Failed to update task. Please try again.');
          this.loadTasks(); // Reload on error
        }
      });
    }
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newTask = {
      title: '',
      description: '',
      status: 'todo',
      category: 'Work',
      organizationId: this.currentUser?.organizationId || 1
    };
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createTask(): void {
    if (!this.newTask.title) {
      return;
    }

    if (this.isOffline) {
      this.setError('You are offline. Reconnect to create tasks.');
      return;
    }

    this.isMutatingTask = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.taskService.createTask(this.newTask).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadTasks();
        this.setSuccess('Task created successfully');
        this.isMutatingTask = false;
      },
      error: (error) => {
        console.error('Failed to create task:', error);
        this.setError(error?.error?.message ?? 'Failed to create task. You may not have permission.');
        this.isMutatingTask = false;
      }
    });
  }

  deleteTask(taskId: number): void {
    if (this.isOffline) {
      this.setError('You are offline. Reconnect to delete tasks.');
      return;
    }

    if (confirm('Are you sure you want to delete this task?')) {
      this.isMutatingTask = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.loadTasks();
          this.setSuccess('Task deleted');
          this.isMutatingTask = false;
        },
        error: (error) => {
          console.error('Failed to delete task:', error);
          this.setError(error?.error?.message ?? 'Failed to delete task. You may not have permission.');
          this.isMutatingTask = false;
        }
      });
    }
  }

  onFilterChange(): void {
    // Reuse the cached tasks instead of hitting the server again
    this.organizeTasks(this.allTasks);
  }

  onSearchChange(): void {
    this.organizeTasks(this.allTasks);
  }

  onSortChange(): void {
    this.organizeTasks(this.allTasks);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleDarkMode(): void {
    const body = document.body;
    if (!body) return;

    const enable = !body.classList.contains('dark-mode');
    if (enable) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }

    localStorage.setItem('task_manager_theme', enable ? 'dark' : 'light');
  }

  get canCreateTasks(): boolean {
    return this.currentUser?.role !== 'Viewer';
  }

  private isTypingInFormField(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      return true;
    }
    return target.isContentEditable;
  }

  private setSuccess(message: string): void {
    this.successMessage = message;
    if (this.successTimer) {
      window.clearTimeout(this.successTimer);
    }
    this.successTimer = window.setTimeout(() => {
      this.successMessage = '';
    }, 2500);
  }

  private setError(message: string): void {
    this.errorMessage = message;
    if (this.errorTimer) {
      window.clearTimeout(this.errorTimer);
    }
    this.errorTimer = window.setTimeout(() => {
      this.errorMessage = '';
    }, 4000);
  }
}
