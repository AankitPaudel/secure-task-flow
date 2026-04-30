$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000/api"
$loginPayload = @{
  email    = "owner@acme.com"
  password = "password123"
} | ConvertTo-Json

Write-Host "Logging in as owner..."
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginPayload

if (-not $loginResponse.access_token) {
  throw "Login failed. No access_token returned."
}

$headers = @{
  Authorization = "Bearer $($loginResponse.access_token)"
  "Content-Type" = "application/json"
}

$existingTasks = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Get -Headers $headers
if ($existingTasks -and $existingTasks.Count -gt 0) {
  Write-Host "Deleting existing tasks..."
  foreach ($task in $existingTasks) {
    Invoke-RestMethod -Uri "$baseUrl/tasks/$($task.id)" -Method Delete -Headers $headers | Out-Null
    Write-Host "Deleted: $($task.title)"
  }
}

$ownerTasks = @(
  @{ title="Owner - Setup RBAC guards"; category="Work"; description="Implement RolesGuard + PermissionsGuard + OrganizationGuard."; status="todo"; organizationId=1 },
  @{ title="Owner - Write API docs in README"; category="Work"; description="Include endpoints + sample requests/responses."; status="todo"; organizationId=1 },
  @{ title="Owner - Buy groceries"; category="Personal"; description="Milk, rice, eggs, fruits."; status="todo"; organizationId=1 },

  @{ title="Owner - Build Angular login flow"; category="Work"; description="JWT storage + interceptor attaching Authorization header."; status="in-progress"; organizationId=1 },
  @{ title="Owner - Improve task search & filters"; category="Work"; description="Search by title + filter by category + sorting."; status="in-progress"; organizationId=1 },
  @{ title="Owner - Gym workout plan"; category="Personal"; description="Cardio + strength routine."; status="in-progress"; organizationId=1 },

  @{ title="Owner - Seed demo users"; category="Work"; description="Owner/Admin/Viewer accounts created on startup."; status="done"; organizationId=1 },
  @{ title="Owner - Dark mode UI"; category="Work"; description="Add toggle + persistent theme preference."; status="done"; organizationId=1 }
)

$childTasks = @(
  @{ title="Admin - Setup RBAC guards"; category="Work"; description="Admin org task for demo."; status="todo"; organizationId=2 },
  @{ title="Admin - Write API docs in README"; category="Work"; description="Admin org task for demo."; status="todo"; organizationId=2 },
  @{ title="Admin - Buy groceries"; category="Personal"; description="Milk, rice, eggs, fruits."; status="todo"; organizationId=2 },

  @{ title="Admin - Build Angular login flow"; category="Work"; description="Admin org task for demo."; status="in-progress"; organizationId=2 },
  @{ title="Admin - Improve task search & filters"; category="Work"; description="Admin org task for demo."; status="in-progress"; organizationId=2 },
  @{ title="Admin - Gym workout plan"; category="Personal"; description="Cardio + strength routine."; status="in-progress"; organizationId=2 },

  @{ title="Admin - Seed demo users"; category="Work"; description="Admin org task for demo."; status="done"; organizationId=2 },
  @{ title="Admin - Dark mode UI"; category="Work"; description="Add toggle + persistent theme preference."; status="done"; organizationId=2 }
)

$tasks = $ownerTasks + $childTasks

Write-Host "Creating demo tasks..."
foreach ($task in $tasks) {
  $body = $task | ConvertTo-Json
  Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Headers $headers -Body $body | Out-Null
  Write-Host "Created: $($task.title)"
}

Write-Host "Done."
