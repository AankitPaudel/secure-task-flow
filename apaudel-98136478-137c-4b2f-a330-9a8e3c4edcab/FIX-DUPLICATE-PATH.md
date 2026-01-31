# Fix for "An item with the same key has already been added" Error

## Problem
You have duplicate `Path` environment variables (one at Machine-level, one at User-level), which causes PowerShell's `Get-ChildItem Env:` command to fail.

## Solution

### Option 1: Manual Fix (Recommended)

1. **Open Environment Variables:**
   - Press `Win + R`
   - Type `sysdm.cpl` and press Enter
   - Click the "Advanced" tab
   - Click "Environment Variables" button

2. **Find and merge the Path variables:**
   - Look in both "User variables" and "System variables" sections
   - Find any variable named `Path` or `PATH`
   - Copy all paths from one variable
   - Edit the other variable and paste the paths (separated by semicolons)
   - Remove any duplicate paths
   - Delete one of the duplicate variables (keep only one)

3. **Restart your terminal/PowerShell** for changes to take effect

### Option 2: PowerShell Fix (Run as Administrator)

```powershell
# Get both Path values
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')

# Merge and remove duplicates
$allPaths = ($machinePath + ';' + $userPath) -split ';' | Where-Object { $_ -ne '' } | Select-Object -Unique
$mergedPath = $allPaths -join ';'

# Set the merged path (choose Machine or User)
[System.Environment]::SetEnvironmentVariable('Path', $mergedPath, 'Machine')

# Remove the duplicate from User variables
[System.Environment]::SetEnvironmentVariable('Path', $null, 'User')
```

### Option 3: Temporary Workaround

If you can't fix it immediately, use this workaround in your scripts:

Instead of:
```powershell
Get-ChildItem Env:
```

Use:
```powershell
[System.Environment]::GetEnvironmentVariables()
```

## Verification

After fixing, verify by running:
```powershell
[System.Environment]::GetEnvironmentVariables() | Where-Object { $_.Keys -match '^[Pp]ath$' }
```

You should only see one Path variable.
