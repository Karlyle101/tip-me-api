# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Create a database user with read/write permissions
4. Get your connection string from the "Connect" button
5. Replace `<username>`, `<password>`, and `<cluster-url>` in the connection string
6. Set the `DATABASE_URL` environment variable in Render

Example connection string:

```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/tipme?retryWrites=true&w=majority
```

## Option 2: Local MongoDB (Development)

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/tipme`

## Environment Variables for Render

In your Render dashboard, set these environment variables:

- `DATABASE_URL`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string (at least 32 characters)
- `SERVICE_FEE_BPS`: Fee in basis points (e.g., 250 for 2.5%)
- `BASE_URL`: Your Render app URL (e.g., https://tip-me-api.onrender.com)

## Benefits of MongoDB vs SQLite

✅ **Persistent Data**: Data survives deployments
✅ **Scalability**: Better performance for production
✅ **Enums**: Native support for enum types
✅ **Indexing**: Better query performance
✅ **Backup**: Automatic backups with Atlas
✅ **Multi-environment**: Same database type for dev/prod

## Migration Steps

1. Set up MongoDB Atlas cluster
2. Update `DATABASE_URL` in Render environment variables
3. Deploy the updated code
4. The database will be automatically created on first use

No data migration needed since this switches the database entirely.
