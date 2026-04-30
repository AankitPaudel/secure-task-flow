import { Component, OnInit, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskCategory, TaskStatus } from '@secure-task-flow/data';
import { canMutateTasks, canViewAuditLog } from '@secure-task-flow/auth';
import { AuthService } from '../services/auth.service';
import { TaskService, Task, CreateTaskDto } from '../services/task.service';
import { AuditLog, AuditService } from '../services/audit.service';

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
  private auditService = inject(AuditService);
  private router = inject(Router);

  readonly TaskStatus = TaskStatus;
  readonly TaskCategory = TaskCategory;
  currentUser = this.authService.getCurrentUser();
  private successTimer?: number;
  private errorTimer?: number;

  // We keep the raw list around and derive the three columns from it
  allTasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  isLoadingTasks = false;
  isLoadingAuditLogs = false;
  isMutatingTask = false;
  errorMessage = '';
  successMessage = '';
  isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
  auditLogs: AuditLog[] = [];
  showAuditPanel = false;

  showCreateModal = false;
  showEditModal = false;
  newTask: CreateTaskDto = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
    organizationId: this.currentUser?.organizationId || 1
  };
  editTask: {
    id: number;
    title: string;
    description: string;
    status: Task['status'];
    category: Task['category'];
  } = {
    id: 0,
    title: '',
    description: '',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
  };

  filterCategory = 'all';
  searchQuery = '';
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
    const workCount = this.allTasks.filter((task) => task.category === TaskCategory.WORK).length;
    const personalCount = this.allTasks.filter((task) => task.category === TaskCategory.PERSONAL).length;
    return [
      { label: 'Work', count: workCount },
      { label: 'Personal', count: personalCount },
    ];
  }

  ngOnInit(): void {
    this.isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    this.loadTasks();
    if (this.canViewAuditLogs) {
      this.loadAuditLogs();
    }
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

  loadAuditLogs(): void {
    if (!this.canViewAuditLogs || this.isOffline) {
      return;
    }

    this.isLoadingAuditLogs = true;
    this.auditService.getAuditLogs().subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.isLoadingAuditLogs = false;
      },
      error: (error) => {
        console.error('Failed to load audit logs:', error);
        this.setError(error?.error?.message ?? 'Could not load audit logs.');
        this.isLoadingAuditLogs = false;
      },
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

    this.todoTasks = sorted.filter(t => t.status === TaskStatus.TODO);
    this.inProgressTasks = sorted.filter(t => t.status === TaskStatus.IN_PROGRESS);
    this.doneTasks = sorted.filter(t => t.status === TaskStatus.DONE);
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus): void {
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
          this.refreshAuditLogsSilently();
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
      status: TaskStatus.TODO,
      category: TaskCategory.WORK,
      organizationId: this.currentUser?.organizationId || 1
    };
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  openEditModal(task: Task): void {
    this.showEditModal = true;
    this.editTask = {
      id: task.id,
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      category: task.category,
    };
  }

  closeEditModal(): void {
    this.showEditModal = false;
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
        this.refreshAuditLogsSilently();
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

  updateTask(): void {
    if (!this.editTask.title) {
      return;
    }

    if (this.isOffline) {
      this.setError('You are offline. Reconnect to update tasks.');
      return;
    }

    this.isMutatingTask = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.taskService
      .updateTask(this.editTask.id, {
        title: this.editTask.title,
        description: this.editTask.description,
        status: this.editTask.status,
        category: this.editTask.category,
      })
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.loadTasks();
          this.refreshAuditLogsSilently();
          this.setSuccess('Task updated successfully');
          this.isMutatingTask = false;
        },
        error: (error) => {
          console.error('Failed to update task:', error);
          this.setError(error?.error?.message ?? 'Failed to update task. You may not have permission.');
          this.isMutatingTask = false;
        },
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
          this.refreshAuditLogsSilently();
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

    localStorage.setItem('secure_task_flow_theme', enable ? 'dark' : 'light');
  }

  toggleAuditPanel(): void {
    this.showAuditPanel = !this.showAuditPanel;
    if (this.showAuditPanel) {
      this.loadAuditLogs();
    }
  }

  get canCreateTasks(): boolean {
    return canMutateTasks(this.currentUser?.role);
  }

  get canViewAuditLogs(): boolean {
    return canViewAuditLog(this.currentUser?.role);
  }

  formatAuditResource(log: AuditLog): string {
    return log.resourceId ? `${log.resource} #${log.resourceId}` : log.resource;
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

  private refreshAuditLogsSilently(): void {
    if (this.canViewAuditLogs && this.showAuditPanel) {
      this.loadAuditLogs();
    }
  }
}
