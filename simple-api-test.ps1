# Simple API Testing Script for Production
param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "Testing Tip Me API at $BaseUrl" -ForegroundColor Green

$passed = 0
$failed = 0

function Test-APIEndpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        $requestParams = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body -and $Method -ne "GET") {
            $requestParams.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-WebRequest @requestParams
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " PASSED" -ForegroundColor Green
            $script:passed++
            return $response.Content | ConvertFrom-Json
        } else {
            Write-Host " FAILED - Status: $($response.StatusCode), Expected: $ExpectedStatus" -ForegroundColor Red
            $script:failed++
            return $null
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host " PASSED (Expected error)" -ForegroundColor Green
            $script:passed++
            return $null
        } else {
            Write-Host " FAILED - $($_.Exception.Message)" -ForegroundColor Red
            $script:failed++
            return $null
        }
    }
}

Write-Host "`nRunning API endpoint tests..." -ForegroundColor Yellow

# Health Check
$health = Test-APIEndpoint -Name "Health Check" -Method "GET" -Url "$BaseUrl/health"

# User registration
$testUser = @{
    email = "apitest@example.com"
    password = "testpassword123"
    name = "API Test User"
    handle = "apitestuser"
    role = "BARISTA"
}

$userReg = Test-APIEndpoint -Name "Register User" -Method "POST" -Url "$BaseUrl/auth/register" -Body $testUser -ExpectedStatus 201
$userToken = $null
if ($userReg) { $userToken = $userReg.token }

# Test duplicate registration (should fail)
Test-APIEndpoint -Name "Reject Duplicate Registration" -Method "POST" -Url "$BaseUrl/auth/register" -Body $testUser -ExpectedStatus 409

# Test login
$loginData = @{
    email = $testUser.email
    password = $testUser.password
}
$login = Test-APIEndpoint -Name "User Login" -Method "POST" -Url "$BaseUrl/auth/login" -Body $loginData

# Test invalid login
$invalidLogin = @{
    email = $testUser.email
    password = "wrongpassword"
}
Test-APIEndpoint -Name "Reject Invalid Login" -Method "POST" -Url "$BaseUrl/auth/login" -Body $invalidLogin -ExpectedStatus 401

# Authenticated endpoints
if ($userToken) {
    $authHeaders = @{ Authorization = "Bearer $userToken" }
    
    Test-APIEndpoint -Name "Get User Info" -Method "GET" -Url "$BaseUrl/auth/me" -Headers $authHeaders
    Test-APIEndpoint -Name "Get User Profile" -Method "GET" -Url "$BaseUrl/users/me" -Headers $authHeaders
    Test-APIEndpoint -Name "Get Incoming Tips" -Method "GET" -Url "$BaseUrl/tips/incoming" -Headers $authHeaders
    Test-APIEndpoint -Name "Get Outgoing Tips" -Method "GET" -Url "$BaseUrl/tips/outgoing" -Headers $authHeaders
    
    # Test payout request
    $payoutRequest = @{ amountCents = 1000 }
    Test-APIEndpoint -Name "Request Payout" -Method "POST" -Url "$BaseUrl/payouts/request" -Headers $authHeaders -Body $payoutRequest -ExpectedStatus 201
    Test-APIEndpoint -Name "Get My Payouts" -Method "GET" -Url "$BaseUrl/payouts" -Headers $authHeaders
}

# Test tip creation (public endpoint)
$tipData = @{
    toHandle = $testUser.handle
    amountCents = 500
    message = "Great service!"
    fromEmail = "customer@example.com"
}
Test-APIEndpoint -Name "Create Tip" -Method "POST" -Url "$BaseUrl/tips" -Body $tipData -ExpectedStatus 201

# Test QR and Portal endpoints
Test-APIEndpoint -Name "Get QR Code" -Method "GET" -Url "$BaseUrl/qr/$($testUser.handle)"
Test-APIEndpoint -Name "Get Tip Portal" -Method "GET" -Url "$BaseUrl/portal/$($testUser.handle)"

# Test not found cases
Test-APIEndpoint -Name "QR Not Found" -Method "GET" -Url "$BaseUrl/qr/nonexistentuser" -ExpectedStatus 404
Test-APIEndpoint -Name "Portal Not Found" -Method "GET" -Url "$BaseUrl/portal/nonexistentuser" -ExpectedStatus 404

# Test unauthenticated requests
Test-APIEndpoint -Name "Reject Unauth User Info" -Method "GET" -Url "$BaseUrl/auth/me" -ExpectedStatus 401
Test-APIEndpoint -Name "Reject Unauth Tips" -Method "GET" -Url "$BaseUrl/tips/incoming" -ExpectedStatus 401

# Test 404 for unknown route
Test-APIEndpoint -Name "404 for Unknown Route" -Method "GET" -Url "$BaseUrl/nonexistent" -ExpectedStatus 404

# Summary
$total = $passed + $failed
Write-Host "`n=== Test Results ===" -ForegroundColor Yellow
Write-Host "Total Tests: $total"
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "`nAll tests passed! Your API is ready for production." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome tests failed. Please review before deploying." -ForegroundColor Yellow
    exit 1
}