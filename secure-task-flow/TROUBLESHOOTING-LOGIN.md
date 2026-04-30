# SecureTaskFlow Login Troubleshooting

## Common Causes of Login Failure

### 1. Backend API Not Running
**Most Common Issue!**

The frontend tries to connect to `http://localhost:3000/api/auth/login`, but if the backend isn't running, you'll get a connection error.

**Solution:**
```powershell
# Start the backend API in a separate terminal
cd "c:\Users\paude\Documents\GitHub\Workspace\secure-task-flow"
npx nx serve api
```

You should see:
```
🚀 Application is running on: http://localhost:3000/api
Database seeded successfully!
Test users:
  Owner: owner@acme.com / password123
  Admin: admin@acme.com / password123
  Viewer: viewer@acme.com / password123
```

### 2. Wrong Credentials
Make sure you're using the correct test credentials:

- **Owner**: `owner@acme.com` / `password123`
- **Admin**: `admin@acme.com` / `password123`
- **Viewer**: `viewer@acme.com` / `password123`

### 3. Database Not Seeded
The database seeds automatically when the API starts. If you see "Database already seeded" in the API logs, the users exist. If you see "Seeding database...", wait for it to complete.

### 4. CORS Issues
The API is configured to allow requests from `http://localhost:4200`. Make sure:
- Your frontend is running on port 4200
- You're accessing the app via `http://localhost:4200` (not 127.0.0.1 or another port)

### 5. Check Browser Console
Open browser DevTools (F12) and check the Console tab for detailed error messages:
- `Cannot connect to server` = Backend not running
- `401 Unauthorized` = Wrong credentials
- `404 Not Found` = Wrong API endpoint
- `CORS error` = CORS configuration issue

## Quick Checklist

- [ ] Backend API is running (`npx nx serve api`)
- [ ] Frontend is running (`npx nx serve dashboard`)
- [ ] Using correct credentials (owner@acme.com / password123)
- [ ] Accessing frontend at `http://localhost:4200`
- [ ] No errors in browser console (F12)
- [ ] Database has been seeded (check API terminal logs)

## Testing the API Directly

You can test if the API is working by opening this URL in your browser:
```
http://localhost:3000/api
```

You should see: `{"message":"Hello API"}`

Or test login with curl:
```powershell
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"owner@acme.com\",\"password\":\"password123\"}"
```
