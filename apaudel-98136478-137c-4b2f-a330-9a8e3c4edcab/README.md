# Secure Task Management System

A full-stack task management application built with NX monorepo, featuring role-based access control (RBAC), JWT authentication, and organizational hierarchy support.

## 📋 Table of Contents

- [Setup Instructions](#setup-instructions)
- [Architecture Overview](#architecture-overview)
- [Data Model](#data-model)
- [Access Control Implementation](#access-control-implementation)
- [API Documentation](#api-documentation)
- [Future Considerations](#future-considerations)

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Git

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Environment Setup

The application uses SQLite by default (no `.env` file needed for development). The database file `database.sqlite` will be created automatically on first run.

For production, you can configure environment variables:

```env
# Database (optional - defaults to SQLite)
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=task_manager

# JWT Secret (optional - defaults to 'your-secret-key')
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server Port (optional - defaults to 3000)
PORT=3000
```

### Running the Application

#### Start Backend API

Open a terminal and run:
```bash
npx nx serve api
```

The API will start on `http://localhost:3000/api`

You should see:
```
🚀 Application is running on: http://localhost:3000/api
Database seeded successfully!
Test users:
  Owner: owner@acme.com / password123
  Admin: admin@acme.com / password123
  Viewer: viewer@acme.com / password123
```

#### Start Frontend Dashboard

Open another terminal and run:
```bash
npx nx serve dashboard
```

The dashboard will start on `http://localhost:4200`

#### Access the Application

1. Open `http://localhost:4200` in your browser
2. Login with one of the test accounts:
   - **Owner**: `owner@acme.com` / `password123`
   - **Admin**: `admin@acme.com` / `password123`
   - **Viewer**: `viewer@acme.com` / `password123`

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npx nx test api

# Run frontend tests only
npx nx test dashboard

# Run e2e tests
npx nx e2e dashboard-e2e
```

---

## 🏗 Architecture Overview

### NX Monorepo Structure

```
apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab/
├── apps/
│   ├── api/              # NestJS backend application
│   └── dashboard/        # Angular frontend application
├── libs/
│   ├── data/             # Shared TypeScript interfaces & DTOs
│   └── auth/             # Reusable RBAC logic and decorators
└── ...
```

### Rationale

**NX Monorepo**: Allows sharing code between frontend and backend, ensuring type safety and consistency across the application. Changes to shared interfaces are immediately reflected in both apps.

**apps/api**: NestJS backend providing RESTful API with TypeORM for database access. Uses SQLite for development (easy setup) but can be configured for PostgreSQL in production.

**apps/dashboard**: Angular standalone components application with TailwindCSS for styling. Uses Angular CDK for drag-and-drop functionality.

**libs/data**: Centralized type definitions, DTOs, and enums shared between frontend and backend. Prevents type mismatches and ensures API contracts are consistent.

**libs/auth**: Reusable authentication and authorization utilities (currently basic structure, can be extended).

### Key Technologies

- **Backend**: NestJS, TypeORM, SQLite/PostgreSQL, JWT (Passport)
- **Frontend**: Angular 21, TailwindCSS, Angular CDK Drag-Drop
- **Monorepo**: NX 22.4.3
- **Testing**: Jest (backend), Jest/Karma (frontend)

---

## 📊 Data Model

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Users     │────────▶│    Roles     │         │    Tasks    │
│─────────────│         │──────────────│         │─────────────│
│ id          │         │ id            │         │ id          │
│ email       │         │ name          │         │ title       │
│ password    │         │ permissions[] │         │ description │
│ name        │         └──────────────┘         │ status      │
│ roleId      │                                  │ category    │
│ orgId       │                                  │ createdById │
└─────────────┘                                  │ orgId       │
      │                                           └─────────────┘
      │                                                  │
      │                                                  │
      │         ┌──────────────┐                        │
      └────────▶│ Organizations │◀───────────────────────┘
                │──────────────│
                │ id            │
                │ name          │
                │ parentOrgId   │
                └──────────────┘
                       │
                       │ (self-reference)
                       │
                       ▼
                ┌──────────────┐
                │ Audit Logs   │
                │──────────────│
                │ id            │
                │ userId        │
                │ action        │
                │ resource      │
                │ resourceId    │
                │ timestamp     │
                └──────────────┘
```

### Entities

#### User
- **id**: Primary key
- **email**: Unique identifier for login
- **password**: Hashed password (bcrypt)
- **name**: Display name
- **roleId**: Foreign key to Role
- **organizationId**: Foreign key to Organization

#### Role
- **id**: Primary key
- **name**: Role name (Owner, Admin, Viewer)
- **permissions**: JSON array of permission strings

#### Organization
- **id**: Primary key
- **name**: Organization name
- **parentOrganizationId**: Optional foreign key for hierarchy (2-level max)

#### Task
- **id**: Primary key
- **title**: Task title (required)
- **description**: Task description (optional)
- **status**: Task status (todo, in-progress, done)
- **category**: Task category (Work, Personal)
- **createdById**: Foreign key to User (creator)
- **organizationId**: Foreign key to Organization
- **createdAt**: Timestamp
- **updatedAt**: Timestamp

#### AuditLog
- **id**: Primary key
- **userId**: Foreign key to User
- **action**: Action performed (CREATE, READ, UPDATE, DELETE, VIEW)
- **resource**: Resource type (e.g., "Task")
- **resourceId**: ID of the resource
- **timestamp**: When the action occurred

### Relationships

- User → Role: Many-to-One (each user has one role)
- User → Organization: Many-to-One (each user belongs to one org)
- Organization → Organization: Self-referential (parent-child, 2-level hierarchy)
- Task → User: Many-to-One (created by user)
- Task → Organization: Many-to-One (belongs to organization)
- AuditLog → User: Many-to-One (action performed by user)

---

## 🔐 Access Control Implementation

### Role-Based Access Control (RBAC)

The system implements a three-tier role hierarchy:

#### Roles and Permissions

1. **Owner**
   - Permissions: `['create', 'read', 'update', 'delete', 'manage_users', 'view_audit']`
   - Can see tasks from their organization AND child organizations
   - Can perform all CRUD operations
   - Can view audit logs

2. **Admin**
   - Permissions: `['create', 'read', 'update', 'delete', 'view_audit']`
   - Can see tasks only from their organization
   - Can perform CRUD operations
   - Can view audit logs

3. **Viewer**
   - Permissions: `['read']`
   - Can see tasks only from their organization
   - Can only view tasks (no create, update, delete)

### Organization Hierarchy

The system supports a 2-level organizational hierarchy:
- **Parent Organization**: Top-level organization
- **Child Organization**: Sub-organization under a parent

**Access Rules:**
- Owners can see tasks from their org + all child orgs
- Admins and Viewers can only see tasks from their own org

### JWT Authentication Flow

1. **Login**: User submits email/password → Backend validates → Returns JWT token + user info
2. **Token Storage**: Frontend stores JWT in localStorage
3. **Request Interceptor**: Angular HTTP interceptor adds `Authorization: Bearer <token>` header to all requests
4. **Token Verification**: NestJS JWT guard validates token on protected routes
5. **User Context**: Decoded JWT payload contains user ID, role, and organization ID

### Guards Implementation

#### JwtAuthGuard
- Validates JWT token from Authorization header
- Extracts user info and attaches to request object
- Protects all authenticated routes

#### RolesGuard
- Checks if user's role matches required roles (supports role inheritance)
- Uses `@Roles()` decorator to specify allowed roles
- Throws `ForbiddenException` if role doesn't match

#### PermissionsGuard
- Checks if user's role has required permissions
- Uses `@Permissions()` decorator to specify required permissions
- Uses the permissions array from the role entity

#### OrganizationGuard
- Ensures user can only access resources from their organization
- For Owners: allows access to parent + child org resources
- For Admins/Viewers: restricts to own org only

### Permission Checks

**Task Creation**: Only Owner and Admin can create tasks
**Task Update**: Only Owner and Admin can update tasks
**Task Deletion**: Only Owner and Admin can delete tasks
**Task Viewing**: All roles can view (scoped to their org level)
**Audit Logs**: Only Owner and Admin can view audit logs

### Audit Logging

All actions are logged to the `audit_logs` table:
- CREATE: When a task is created
- UPDATE: When a task is updated
- DELETE: When a task is deleted
- VIEW: When tasks are listed or viewed

Logs include: user ID, action type, resource type, resource ID, and timestamp.

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All endpoints (except `/auth/login` and `/auth/register`) require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication

##### POST `/auth/login`
Login and receive JWT token.

**Request:**
```json
{
  "email": "owner@acme.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "owner@acme.com",
    "name": "John Owner",
    "role": "Owner",
    "organizationId": 1
  }
}
```

**Error (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

##### POST `/auth/register`
Register a new user (optional endpoint).

**Request:**
```json
{
  "email": "newuser@acme.com",
  "password": "password123",
  "name": "New User",
  "roleId": 2,
  "organizationId": 1
}
```

#### Tasks

##### GET `/tasks`
Get all tasks accessible to the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive README",
    "status": "in-progress",
    "category": "Work",
    "createdById": 1,
    "organizationId": 1,
    "createdAt": "2026-01-30T08:00:00.000Z",
    "updatedAt": "2026-01-30T08:00:00.000Z",
    "createdBy": {
      "id": 1,
      "name": "John Owner"
    },
    "organization": {
      "id": 1,
      "name": "Acme Corporation"
    }
  }
]
```

**Access Rules:**
- Owner: Sees tasks from their org + child orgs
- Admin/Viewer: Sees tasks from their org only

##### POST `/tasks`
Create a new task. Requires Owner or Admin role.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "todo",
  "category": "Work",
  "organizationId": 1
}
```

**Response (201):**
```json
{
  "id": 2,
  "title": "New Task",
  "description": "Task description",
  "status": "todo",
  "category": "Work",
  "createdById": 1,
  "organizationId": 1,
  "createdAt": "2026-01-30T08:00:00.000Z",
  "updatedAt": "2026-01-30T08:00:00.000Z"
}
```

**Error (403):**
```json
{
  "statusCode": 403,
  "message": "Viewers cannot create tasks"
}
```

##### GET `/tasks/:id`
Get a single task by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "title": "Complete project documentation",
  "description": "Write comprehensive README",
  "status": "in-progress",
  "category": "Work",
  "createdById": 1,
  "organizationId": 1,
  "createdAt": "2026-01-30T08:00:00.000Z",
  "updatedAt": "2026-01-30T08:00:00.000Z"
}
```

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "Task with ID 999 not found"
}
```

##### PUT `/tasks/:id`
Update a task. Requires Owner or Admin role.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "done",
  "title": "Updated title"
}
```

**Response (200):**
```json
{
  "id": 1,
  "title": "Updated title",
  "status": "done",
  ...
}
```

##### DELETE `/tasks/:id`
Delete a task. Requires Owner or Admin role.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

#### Audit Logs

##### GET `/audit-log`
Get audit logs. Requires Owner or Admin role.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "action": "CREATE",
    "resource": "Task",
    "resourceId": 1,
    "timestamp": "2026-01-30T08:00:00.000Z",
    "user": {
      "id": 1,
      "name": "John Owner",
      "email": "owner@acme.com"
    }
  }
]
```

---

## 🔮 Future Considerations

### Security Enhancements

1. **JWT Refresh Tokens**
   - Implement refresh token rotation
   - Shorter access token lifetime (15 minutes)
   - Longer refresh token lifetime (7 days)
   - Token blacklisting for logout

2. **CSRF Protection**
   - Implement CSRF tokens for state-changing operations
   - Use SameSite cookies
   - Validate Origin header

3. **Rate Limiting**
   - Implement rate limiting per user/IP
   - Prevent brute force attacks on login
   - Throttle API requests

4. **Input Validation**
   - Enhanced DTO validation
   - Sanitize user inputs
   - Prevent SQL injection (already handled by TypeORM, but add extra validation)

### Performance Optimizations

1. **RBAC Caching**
   - Cache user permissions in Redis
   - Invalidate cache on role/permission changes
   - Reduce database queries for permission checks

2. **Database Indexing**
   - Add indexes on frequently queried fields (organizationId, status, category)
   - Optimize audit log queries with proper indexing

3. **Pagination**
   - Implement pagination for task lists
   - Add cursor-based pagination for large datasets
   - Limit audit log results

### Advanced Features

1. **Role Delegation**
   - Allow Owners to delegate permissions temporarily
   - Time-limited role assignments
   - Audit trail for delegation actions

2. **Multi-level Organization Hierarchy**
   - Extend beyond 2 levels
   - Implement recursive org queries
   - Handle complex permission inheritance

3. **Task Assignment**
   - Assign tasks to specific users
   - Task ownership transfer
   - Due dates and reminders

4. **Real-time Updates**
   - WebSocket support for live task updates
   - Collaborative editing
   - Real-time notifications

5. **Advanced Analytics**
   - Task completion trends
   - User productivity metrics
   - Organization performance dashboards

### Scalability

1. **Microservices Architecture**
   - Split auth service
   - Separate task service
   - Independent audit service

2. **Database Scaling**
   - Read replicas for read-heavy operations
   - Sharding for large organizations
   - Archive old audit logs

3. **Caching Strategy**
   - Redis for session management
   - CDN for static assets
   - Application-level caching

### Testing Improvements

1. **E2E Testing**
   - Comprehensive Playwright tests
   - Test all user flows
   - Cross-browser testing

2. **Integration Testing**
   - Test API endpoints with real database
   - Test authentication flows
   - Test permission boundaries

3. **Performance Testing**
   - Load testing with k6 or Artillery
   - Stress testing
   - Identify bottlenecks

---

## 📝 License

MIT

---

## 👤 Author

Built as part of a coding challenge demonstrating full-stack development skills with NX monorepo, NestJS, Angular, and RBAC implementation.
