# Comprehensive API Testing Script for Production
# This script tests all endpoints of the Tip Me API

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$OutputFile = "api-test-results.json"
)

Write-Host "🧪 Testing Tip Me API at $BaseUrl" -ForegroundColor Green

$testResults = @{
    timestamp = Get-Date
    baseUrl = $BaseUrl
    tests = @()
    summary = @{
        total = 0
        passed = 0
        failed = 0
    }
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200,
        [string[]]$ExpectedProperties = @()
    )
    
    $testResults.summary.total++
    $test = @{
        name = $Name
        method = $Method
        url = $Url
        expectedStatus = $ExpectedStatus
        status = "FAILED"
        actualStatus = 0
        duration = 0
        error = $null
        response = $null
    }
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        $requestParams = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($Body -and $Method -ne "GET") {
            $requestParams.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @requestParams
        $stopwatch.Stop()
        
        $test.duration = $stopwatch.ElapsedMilliseconds
        $test.actualStatus = 200  # Invoke-RestMethod succeeds with 2xx status codes
        $test.response = $response
        
        if ($test.actualStatus -eq $ExpectedStatus) {
            # Check for expected properties
            $propertiesValid = $true
            foreach ($prop in $ExpectedProperties) {
                if (-not ($response | Get-Member -Name $prop -MemberType Properties,NoteProperty)) {
                    $propertiesValid = $false
                    $test.error = "Missing expected property: $prop"
                    break
                }
            }
            
            if ($propertiesValid) {
                $test.status = "PASSED"
                $testResults.summary.passed++
                Write-Host "✅ $Name" -ForegroundColor Green
            } else {
                $testResults.summary.failed++
                Write-Host "❌ $Name - $($test.error)" -ForegroundColor Red
            }
        } else {
            $test.error = "Status code mismatch"
            $testResults.summary.failed++
            Write-Host "❌ $Name - Expected: $ExpectedStatus, Got: $($test.actualStatus)" -ForegroundColor Red
        }
    }
    catch {
        $stopwatch.Stop()
        $test.duration = $stopwatch.ElapsedMilliseconds
        $test.error = $_.Exception.Message
        
        # Handle specific HTTP status codes
        if ($_.Exception -match "(\d{3})") {
            $test.actualStatus = [int]$Matches[1]
            if ($test.actualStatus -eq $ExpectedStatus) {
                $test.status = "PASSED"
                $testResults.summary.passed++
                Write-Host "✅ $Name (Expected error response)" -ForegroundColor Green
            } else {
                $testResults.summary.failed++
                Write-Host "❌ $Name - Expected: $ExpectedStatus, Got: $($test.actualStatus)" -ForegroundColor Red
            }
        } else {
            $testResults.summary.failed++
            Write-Host "❌ $Name - $($test.error)" -ForegroundColor Red
        }
    }
    
    $testResults.tests += $test
}

# Start testing
Write-Host "`n📋 Running comprehensive API tests...`n" -ForegroundColor Yellow

# Health Check
Test-Endpoint -Name "Health Check" -Method "GET" -Url "$BaseUrl/health" -ExpectedProperties @("ok")

# User registration and authentication flow
$testUser = @{
    email = "apitest@example.com"
    password = "testpassword123"
    name = "API Test User"
    handle = "apitestuser"
    role = "BARISTA"
}

$adminUser = @{
    email = "apitestadmin@example.com"
    password = "adminpassword123"
    name = "API Test Admin"
    handle = "apitestadmin"
    role = "CUSTOMER"
}

# Test user registration
Test-Endpoint -Name "Register User" -Method "POST" -Url "$BaseUrl/auth/register" -Body $testUser -ExpectedStatus 201 -ExpectedProperties @("token", "user")

# Extract token for authenticated requests
$userToken = $null
if ($testResults.tests[-1].status -eq "PASSED") {
    $userToken = $testResults.tests[-1].response.token
}

# Test admin registration
Test-Endpoint -Name "Register Admin User" -Method "POST" -Url "$BaseUrl/auth/register" -Body $adminUser -ExpectedStatus 201 -ExpectedProperties @("token", "user")

$adminToken = $null
if ($testResults.tests[-1].status -eq "PASSED") {
    $adminToken = $testResults.tests[-1].response.token
}

# Test duplicate registration
Test-Endpoint -Name "Reject Duplicate Registration" -Method "POST" -Url "$BaseUrl/auth/register" -Body $testUser -ExpectedStatus 409

# Test login
$loginData = @{
    email = $testUser.email
    password = $testUser.password
}
Test-Endpoint -Name "User Login" -Method "POST" -Url "$BaseUrl/auth/login" -Body $loginData -ExpectedStatus 200 -ExpectedProperties @("token", "user")

# Test invalid login
$invalidLogin = @{
    email = $testUser.email
    password = "wrongpassword"
}
Test-Endpoint -Name "Reject Invalid Login" -Method "POST" -Url "$BaseUrl/auth/login" -Body $invalidLogin -ExpectedStatus 401

# Authenticated endpoints
if ($userToken) {
    $authHeaders = @{ Authorization = "Bearer $userToken" }
    
    # Test authenticated user info
    Test-Endpoint -Name "Get User Info (Auth)" -Method "GET" -Url "$BaseUrl/auth/me" -Headers $authHeaders -ExpectedProperties @("user")
    Test-Endpoint -Name "Get User Profile" -Method "GET" -Url "$BaseUrl/users/me" -Headers $authHeaders -ExpectedProperties @("user")
    
    # Test tips endpoints
    Test-Endpoint -Name "Get Incoming Tips" -Method "GET" -Url "$BaseUrl/tips/incoming" -Headers $authHeaders -ExpectedProperties @("tips")
    Test-Endpoint -Name "Get Outgoing Tips" -Method "GET" -Url "$BaseUrl/tips/outgoing" -Headers $authHeaders -ExpectedProperties @("tips")
    
    # Test payouts endpoints
    $payoutRequest = @{ amountCents = 1000 }
    Test-Endpoint -Name "Request Payout" -Method "POST" -Url "$BaseUrl/payouts/request" -Headers $authHeaders -Body $payoutRequest -ExpectedStatus 201 -ExpectedProperties @("payout")
    Test-Endpoint -Name "Get My Payouts" -Method "GET" -Url "$BaseUrl/payouts" -Headers $authHeaders -ExpectedProperties @("payouts")
}

# Test public endpoints
$tipData = @{
    toHandle = $testUser.handle
    amountCents = 500
    message = "Great service!"
    fromEmail = "customer@example.com"
}
Test-Endpoint -Name "Create Tip (Public)" -Method "POST" -Url "$BaseUrl/tips" -Body $tipData -ExpectedStatus 201 -ExpectedProperties @("tip")

# Test QR and Portal endpoints
Test-Endpoint -Name "Get QR Code" -Method "GET" -Url "$BaseUrl/qr/$($testUser.handle)" -ExpectedStatus 200
Test-Endpoint -Name "Get Tip Portal" -Method "GET" -Url "$BaseUrl/portal/$($testUser.handle)" -ExpectedStatus 200

# Test not found cases
Test-Endpoint -Name "QR Code Not Found" -Method "GET" -Url "$BaseUrl/qr/nonexistentuser" -ExpectedStatus 404
Test-Endpoint -Name "Portal Not Found" -Method "GET" -Url "$BaseUrl/portal/nonexistentuser" -ExpectedStatus 404

# Admin endpoints (if admin token available)
# Note: First need to manually update the admin user role in database for full admin testing

# Test unauthenticated requests
Test-Endpoint -Name "Reject Unauth User Info" -Method "GET" -Url "$BaseUrl/auth/me" -ExpectedStatus 401
Test-Endpoint -Name "Reject Unauth Tips" -Method "GET" -Url "$BaseUrl/tips/incoming" -ExpectedStatus 401
Test-Endpoint -Name "Reject Unauth Payouts" -Method "GET" -Url "$BaseUrl/payouts" -ExpectedStatus 401

# Test 404 for unknown routes
Test-Endpoint -Name "404 for Unknown Route" -Method "GET" -Url "$BaseUrl/nonexistent" -ExpectedStatus 404

# Generate report
Write-Host "`n📊 Test Results Summary:" -ForegroundColor Yellow
Write-Host "Total Tests: $($testResults.summary.total)"
Write-Host "Passed: $($testResults.summary.passed) ✅" -ForegroundColor Green
Write-Host "Failed: $($testResults.summary.failed) ❌" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($testResults.summary.passed / $testResults.summary.total) * 100, 2))%"

# Save detailed results to file
$testResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
Write-Host "`n📝 Detailed results saved to: $OutputFile" -ForegroundColor Cyan

if ($testResults.summary.failed -eq 0) {
    Write-Host "`n🎉 All tests passed! Your API is ready for production." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️ Some tests failed. Please review the results before deploying." -ForegroundColor Yellow
    exit 1
}