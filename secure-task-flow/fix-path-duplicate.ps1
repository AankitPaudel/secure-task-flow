# Script to fix duplicate PATH environment variables
# Run this script as Administrator to permanently fix the issue

Write-Host "Checking for duplicate PATH environment variables..." -ForegroundColor Yellow

# Get environment variables using .NET method (avoids the Get-ChildItem error)
$envVars = [System.Environment]::GetEnvironmentVariables([System.EnvironmentVariableTarget]::Machine)
$userEnvVars = [System.Environment]::GetEnvironmentVariables([System.EnvironmentVariableTarget]::User)

# Check for duplicates
$pathVars = @{}
$allVars = @{}

# Check Machine-level variables
foreach ($key in $envVars.Keys) {
    if ($key -match '^[Pp]ath$') {
        $pathVars[$key] = $envVars[$key]
        Write-Host "Found Machine-level: $key" -ForegroundColor Cyan
    }
}

# Check User-level variables
foreach ($key in $userEnvVars.Keys) {
    if ($key -match '^[Pp]ath$') {
        $pathVars[$key] = $userEnvVars[$key]
        Write-Host "Found User-level: $key" -ForegroundColor Cyan
    }
}

if ($pathVars.Count -gt 1) {
    Write-Host "`nDuplicate PATH variables found!" -ForegroundColor Red
    Write-Host "`nCurrent values:" -ForegroundColor Yellow
    
    # Merge the paths
    $mergedPath = @()
    foreach ($key in $pathVars.Keys) {
        Write-Host "  $key : $($pathVars[$key].Substring(0, [Math]::Min(80, $pathVars[$key].Length)))..." -ForegroundColor Gray
        $paths = $pathVars[$key] -split ';' | Where-Object { $_ -ne '' }
        $mergedPath += $paths
    }
    
    # Remove duplicates and join
    $uniquePaths = $mergedPath | Select-Object -Unique
    $finalPath = $uniquePaths -join ';'
    
    Write-Host "`nMerged PATH (unique entries):" -ForegroundColor Green
    Write-Host "  Length: $($finalPath.Length) characters" -ForegroundColor Gray
    Write-Host "  Entries: $($uniquePaths.Count) unique paths" -ForegroundColor Gray
    
    Write-Host "`nTo fix this permanently:" -ForegroundColor Yellow
    Write-Host "1. Press Win+R, type 'sysdm.cpl', press Enter" -ForegroundColor White
    Write-Host "2. Go to 'Advanced' tab > 'Environment Variables'" -ForegroundColor White
    Write-Host "3. In 'System variables' or 'User variables', find both PATH and Path" -ForegroundColor White
    Write-Host "4. Edit one of them and add all paths from the other (separated by semicolons)" -ForegroundColor White
    Write-Host "5. Delete the duplicate variable" -ForegroundColor White
    Write-Host "6. Restart your terminal/PowerShell" -ForegroundColor White
    
    Write-Host "`nOr run this script as Administrator to attempt automatic fix:" -ForegroundColor Yellow
    Write-Host "  Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment' -Name 'Path' -Value `"$finalPath`"" -ForegroundColor Gray
} else {
    Write-Host "No duplicate PATH variables found in environment." -ForegroundColor Green
    Write-Host "The error might be coming from a PowerShell profile or script." -ForegroundColor Yellow
}

Write-Host "`nTemporary workaround for current session:" -ForegroundColor Yellow
Write-Host "Use [System.Environment]::GetEnvironmentVariables() instead of Get-ChildItem Env:" -ForegroundColor Gray
