# Test API Endpoints for Tip Me API
param(
    [string]$BaseUrl = "https://tip-me-api-638958828459649923.azurewebsites.net"
)

Write-Host "Testing Tip Me API endpoints..." -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Test results
$TestResults = @()

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$Description
    )
    
    try {
        $uri = "$BaseUrl$Endpoint"
        Write-Host "Testing: $Method $Endpoint" -ForegroundColor Cyan
        
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host "✅ SUCCESS: $Description" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
        
        $script:TestResults += @{
            Endpoint = $Endpoint
            Method = $Method
            Status = "SUCCESS"
            Description = $Description
            Response = $response
        }
    }
    catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
        }
        
        Write-Host "❌ FAILED: $Description" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        
        $script:TestResults += @{
            Endpoint = $Endpoint
            Method = $Method
            Status = "FAILED"
            Description = $Description
            Error = $_.Exception.Message
            StatusCode = $statusCode
        }
    }
    
    Write-Host ""
}

# 1. Health Check
Test-Endpoint -Method "GET" -Endpoint "/health" -Description "Health check endpoint"

# 2. API Root
Test-Endpoint -Method "GET" -Endpoint "/" -Description "API root endpoint"

# 3. Auth Endpoints
Test-Endpoint -Method "POST" -Endpoint "/auth/register" `
    -Body '{"email": "test@example.com", "password": "testpass123", "name": "Test User"}' `
    -Description "User registration"

Test-Endpoint -Method "POST" -Endpoint "/auth/login" `
    -Body '{"email": "test@example.com", "password": "testpass123"}' `
    -Description "User login"

# 4. QR Code Endpoint
Test-Endpoint -Method "GET" -Endpoint "/qr/generate?data=test" -Description "QR code generation"

# 5. Users Endpoints (these might require authentication)
Test-Endpoint -Method "GET" -Endpoint "/users/profile" -Description "User profile (should fail without auth)"

# 6. Tips Endpoints
Test-Endpoint -Method "GET" -Endpoint "/tips" -Description "Get tips (should fail without auth)"

# 7. Admin Endpoints
Test-Endpoint -Method "GET" -Endpoint "/admin/stats" -Description "Admin stats (should fail without auth)"

# 8. Portal Endpoints
Test-Endpoint -Method "GET" -Endpoint "/portal/dashboard" -Description "Portal dashboard (should fail without auth)"

# Summary
Write-Host "=== TEST SUMMARY ===" -ForegroundColor Yellow
$successCount = ($TestResults | Where-Object { $_.Status -eq "SUCCESS" }).Count
$failedCount = ($TestResults | Where-Object { $_.Status -eq "FAILED" }).Count

Write-Host "Total Tests: $($TestResults.Count)" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green  
Write-Host "Failed: $failedCount" -ForegroundColor Red

Write-Host ""
Write-Host "=== DETAILED RESULTS ===" -ForegroundColor Yellow

foreach ($result in $TestResults) {
    $status = if ($result.Status -eq "SUCCESS") { "✅" } else { "❌" }
    $color = if ($result.Status -eq "SUCCESS") { "Green" } else { "Red" }
    
    Write-Host "$status $($result.Method) $($result.Endpoint) - $($result.Description)" -ForegroundColor $color
    
    if ($result.Status -eq "FAILED") {
        Write-Host "   Error: $($result.Error)" -ForegroundColor Red
    }
}

# Export results to file
$TestResults | ConvertTo-Json -Depth 3 | Out-File -FilePath "api-test-results.json" -Encoding UTF8
Write-Host ""
Write-Host "Test results saved to: api-test-results.json" -ForegroundColor Yellow