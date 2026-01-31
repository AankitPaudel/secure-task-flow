# How to Start the Backend API

## Quick Start

Open a **new PowerShell terminal** and run:

```powershell
cd "c:\Users\paude\Documents\Ankit\Workspace\apaudel-98136478-137c-4b2f-a330-9a8e3c4edcab"
npx nx serve api
```

## What to Expect

You should see output like:
```
> nx run api:serve:development

🚀 Application is running on: http://localhost:3000/api
Database seeded successfully!
Test users:
  Owner: owner@acme.com / password123
  Admin: admin@acme.com / password123
  Viewer: viewer@acme.com / password123
```

## Keep This Terminal Open

**Important:** Keep this terminal window open while you're using the application. The API needs to be running for the frontend to work.

## Verify It's Working

Once started, you can test it by opening this URL in your browser:
```
http://localhost:3000/api
```

You should see: `{"message":"Hello API"}`

## Troubleshooting

### If you get permission errors:
1. Close all terminals
2. Restart your terminal/PowerShell
3. Try again

### If port 3000 is already in use:
The API will try to use port 3000. If something else is using it:
1. Close the other application using port 3000, OR
2. Set a different port: `$env:PORT=3001; npx nx serve api`

### If the database doesn't seed:
- Check the terminal output for errors
- Make sure you have write permissions in the project directory
- The database file `database.sqlite` should be created in the project root

## Test Login Credentials

Once the API is running, use these credentials in the frontend:
- **Owner**: `owner@acme.com` / `password123`
- **Admin**: `admin@acme.com` / `password123`
- **Viewer**: `viewer@acme.com` / `password123`
