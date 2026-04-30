# SecureTaskFlow Project Status

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
- API E2E: health check, login, task CRUD, audit log, and Viewer forbidden checks

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
- Owner/Admin audit log panel
- Shared monorepo DTOs and RBAC helpers in dashboard
- Tests: dashboard component, auth service, task service

### Documentation
- Portfolio README with setup, architecture, security model, API docs, screenshots placeholders, and roadmap
- START-API quickstart for backend
- GitHub Actions CI workflow

## Remaining
- Deploy a live demo
- Add screenshots or GIFs for the portfolio page
- Add production auth hardening such as refresh tokens and rate limiting
