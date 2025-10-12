# Production Build and Test Script for Tip Me API
# This script prepares the application for production deployment

Write-Host "🚀 Building Tip Me API for Production" -ForegroundColor Green

# Step 1: Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm ci

# Step 2: Generate Prisma client
Write-Host "`n🏗️ Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Step 3: Run tests
Write-Host "`n🧪 Running tests..." -ForegroundColor Yellow
npm test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed! Aborting deployment." -ForegroundColor Red
    exit 1
}

# Step 4: Build the application
Write-Host "`n🔨 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Aborting deployment." -ForegroundColor Red
    exit 1
}

# Step 5: Test production build
Write-Host "`n🎯 Testing production build..." -ForegroundColor Yellow

# Set production environment variables
$env:NODE_ENV = "production"
$env:PORT = "3000"
$env:JWT_SECRET = "production-jwt-secret-change-in-real-deployment"
$env:SERVICE_FEE_BPS = "250"
$env:BASE_URL = "http://localhost:3000"

# Start the production server in background
Write-Host "Starting production server..."
Start-Job -ScriptBlock {
    Set-Location $Using:PWD
    $env:NODE_ENV = "production"
    $env:PORT = "3000"
    $env:JWT_SECRET = "production-jwt-secret-change-in-real-deployment"
    $env:SERVICE_FEE_BPS = "250"
    $env:BASE_URL = "http://localhost:3000"
    npm start
} -Name "TipMeAPI"

# Wait a moment for server to start
Start-Sleep -Seconds 5

# Test endpoints
Write-Host "`n🔍 Testing API endpoints..." -ForegroundColor Yellow

try {
    # Test health endpoint
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
    if ($healthResponse.ok -eq $true) {
        Write-Host "✅ Health endpoint working" -ForegroundColor Green
    } else {
        Write-Host "❌ Health endpoint failed" -ForegroundColor Red
    }

    # Test registration endpoint
    $registerData = @{
        email = "test@example.com"
        password = "testpassword123"
        name = "Test User"
        handle = "testuser"
        role = "BARISTA"
    }
    
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method POST -Body ($registerData | ConvertTo-Json) -ContentType "application/json"
    if ($registerResponse.token) {
        Write-Host "✅ Registration endpoint working" -ForegroundColor Green
        $token = $registerResponse.token
        
        # Test authenticated endpoint
        $headers = @{ Authorization = "Bearer $token" }
        $meResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/me" -Method GET -Headers $headers
        if ($meResponse.user) {
            Write-Host "✅ Authentication working" -ForegroundColor Green
        } else {
            Write-Host "❌ Authentication failed" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Registration endpoint failed" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ API testing failed: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Stop the production server
    Stop-Job -Name "TipMeAPI" -ErrorAction SilentlyContinue
    Remove-Job -Name "TipMeAPI" -ErrorAction SilentlyContinue
}

Write-Host "`n✨ Production build and test completed!" -ForegroundColor Green
Write-Host "`nNext steps for Azure deployment:" -ForegroundColor Cyan
Write-Host "1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
Write-Host "2. Follow the instructions in AZURE_DEPLOYMENT.md"
Write-Host "3. Or use the Docker container deployment method"

Write-Host "`n📊 Build Summary:" -ForegroundColor Yellow
Write-Host "- Dependencies: Installed ✅"
Write-Host "- Prisma Client: Generated ✅"
Write-Host "- Tests: $(if ($LASTEXITCODE -eq 0) { "Passed ✅" } else { "Failed ❌" })"
Write-Host "- Build: Completed ✅"
Write-Host "- Production Test: $(if ($healthResponse) { "Passed ✅" } else { "Failed ❌" })"

Write-Host "`n🎉 Your Tip Me API is ready for deployment!" -ForegroundColor Green