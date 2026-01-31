# Project Status

## Done

### Backend
- NestJS + TypeORM (SQLite default, PostgreSQL supported)
- JWT authentication with login/register
- RBAC roles: Owner, Admin, Viewer
- Permission checks via PermissionsGuard + decorator
- Role inheritance logic in RolesGuard
- Organization hierarchy (2-level) and org access guard
- Tasks CRUD with PUT update endpoint
- Task visibility scoped to org and role
- Audit logging (DB + console), audit-log endpoint protected
- Database seeding with test users
- Tests: auth service, roles guard, permissions guard, organization guard, tasks service, controllers
- API E2E: health check + login + tasks list

### Frontend
- Angular dashboard with drag-and-drop task board
- Login UI, JWT storage, HTTP interceptor
- Task filters, search, sorting
- Loading and empty states
- Success/error banners + auto-dismiss
- Offline detection messaging
- Keyboard shortcuts (new task, search focus)
- Dark/light mode toggle
- Task completion progress bar and category summary
- Tests: dashboard component, auth service, task service

### Documentation
- README with setup, architecture, data model, access control, API docs, future notes
- START-API quickstart for backend

## Remaining
- Run test suites to verify on your machine
- Optional: expand E2E coverage beyond login + list
