# Azure Deployment Guide for Tip Me API

This guide provides step-by-step instructions to deploy the Tip Me API to Microsoft Azure using different deployment options.

## Prerequisites

1. **Azure CLI**: Install the Azure CLI from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Docker** (for container deployments): Install Docker from [here](https://docs.docker.com/get-docker/)
3. **Azure Account**: You need an active Azure subscription

## Login to Azure

```bash
az login
```

## Set up Variables

```bash
# Resource Group
RESOURCE_GROUP="tip-me-api-rg"
LOCATION="eastus"
APP_NAME="tip-me-api-$(date +%s)"
JWT_SECRET="your-very-secure-jwt-secret-here"
```

## Option 1: Azure App Service Deployment

### 1. Create Resource Group
```bash
az group create --name $RESOURCE_GROUP --location $LOCATION
```

### 2. Create App Service Plan
```bash
az appservice plan create \
  --name tip-me-api-plan \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux
```

### 3. Create Web App
```bash
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan tip-me-api-plan \
  --name $APP_NAME \
  --runtime "NODE|18-lts"
```

### 4. Configure Environment Variables
```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    NODE_ENV=production \
    JWT_SECRET="$JWT_SECRET" \
    SERVICE_FEE_BPS=250 \
    BASE_URL="https://$APP_NAME.azurewebsites.net"
```

### 5. Enable Always On
```bash
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --always-on true
```

### 6. Deploy from Local Git or GitHub
```bash
# Option A: Local Git deployment
az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Then push your code to the git remote provided

# Option B: GitHub deployment (replace with your GitHub repo)
az webapp deployment source config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --repo-url https://github.com/yourusername/tip-me-api \
  --branch main \
  --manual-integration
```

## Option 2: Azure Container Instances

### 1. Build and Push Docker Image

```bash
# Create Azure Container Registry
ACR_NAME="tipmeapiacr$(date +%s)"
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic

# Login to ACR
az acr login --name $ACR_NAME

# Build and push image
docker build -t $ACR_NAME.azurecr.io/tip-me-api:latest .
docker push $ACR_NAME.azurecr.io/tip-me-api:latest
```

### 2. Deploy Container Instance

```bash
az container create \
  --resource-group $RESOURCE_GROUP \
  --name tip-me-api-container \
  --image $ACR_NAME.azurecr.io/tip-me-api:latest \
  --registry-login-server $ACR_NAME.azurecr.io \
  --registry-username $(az acr credential show --name $ACR_NAME --query username --output tsv) \
  --registry-password $(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv) \
  --dns-name-label tip-me-api-$(date +%s) \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    JWT_SECRET="$JWT_SECRET" \
    SERVICE_FEE_BPS=250 \
    BASE_URL="https://tip-me-api-$(date +%s).eastus.azurecontainer.io" \
  --cpu 1 \
  --memory 1
```

## Option 3: Using ARM Template for Container Instances

```bash
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file azure-container-instances.json \
  --parameters \
    image="$ACR_NAME.azurecr.io/tip-me-api:latest" \
    jwtSecret="$JWT_SECRET"
```

## Database Setup

For production, you'll want to use Azure Database instead of SQLite:

### Azure SQL Database
```bash
# Create Azure SQL Server
az sql server create \
  --name tip-me-sql-server \
  --resource-group $RESOURCE_GROUP \
  --admin-user tipadmin \
  --admin-password YourSecurePassword123!

# Create database
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server tip-me-sql-server \
  --name tip-me-db \
  --service-objective Basic

# Update connection string in your app settings
DATABASE_URL="sqlserver://tipadmin:YourSecurePassword123!@tip-me-sql-server.database.windows.net:1433/tip-me-db"
```

### PostgreSQL (Alternative)
```bash
# Create PostgreSQL server
az postgres server create \
  --name tip-me-postgres \
  --resource-group $RESOURCE_GROUP \
  --admin-user tipadmin \
  --admin-password YourSecurePassword123! \
  --sku-name B_Gen5_1

# Create database
az postgres db create \
  --resource-group $RESOURCE_GROUP \
  --server-name tip-me-postgres \
  --name tip-me-db

# Update connection string
DATABASE_URL="postgresql://tipadmin:YourSecurePassword123!@tip-me-postgres.postgres.database.azure.com:5432/tip-me-db"
```

## Post-Deployment Steps

1. **Test your deployment**:
```bash
# Get your app URL
echo "Your app is deployed at: https://$APP_NAME.azurewebsites.net"

# Test health endpoint
curl https://$APP_NAME.azurewebsites.net/health
```

2. **Run database migrations** (if using external database):
```bash
# SSH into your app service or run locally with production DATABASE_URL
npx prisma migrate deploy
```

3. **Monitor your application**:
   - Set up Application Insights for monitoring
   - Configure alerts for errors and performance
   - Set up log streaming for debugging

## Security Considerations

1. **Use Azure Key Vault** for secrets:
```bash
az keyvault create \
  --name tip-me-keyvault \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

az keyvault secret set \
  --vault-name tip-me-keyvault \
  --name JWT-SECRET \
  --value "$JWT_SECRET"
```

2. **Enable HTTPS only**:
```bash
az webapp update \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --https-only true
```

3. **Configure custom domain** (optional):
```bash
az webapp config hostname add \
  --webapp-name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname your-custom-domain.com
```

## Scaling

### App Service Scaling
```bash
# Scale up (vertical)
az appservice plan update \
  --name tip-me-api-plan \
  --resource-group $RESOURCE_GROUP \
  --sku P1V2

# Scale out (horizontal)
az webapp update \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --deployment-source-branch main
```

## Troubleshooting

1. **View logs**:
```bash
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP
```

2. **Check deployment status**:
```bash
az webapp deployment list --name $APP_NAME --resource-group $RESOURCE_GROUP
```

3. **SSH into container** (App Service):
```bash
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP
```

## Cleanup

To remove all resources:
```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```