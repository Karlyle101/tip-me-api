# Tip Me API Documentation

## Base URL

Production: `https://tip-me-api.onrender.com`

## Database

The API now uses MongoDB for persistent data storage. This means:

- Data persists across deployments
- No database resets when redeploying
- Scalable document-based storage

## Environment Variables

Required environment variables for deployment:

- `DATABASE_URL`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `BASE_URL`: Base URL for QR code generation
- `SERVICE_FEE_BPS`: Service fee in basis points (default: 250 = 2.5%)

## Authentication

Most endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Health Check

- **GET** `/health`
- **Description**: Check API status
- **Response**: `{"ok": true}`

### Authentication

#### Register User

- **POST** `/auth/register`
- **Body**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "handle": "username123",
  "role": "CUSTOMER" // or "BARISTA"
}
```

- **Response**: JWT token and user data

#### Login

- **POST** `/auth/login`
- **Body**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **Response**: JWT token and user data

#### Get Current User

- **GET** `/auth/me`
- **Auth**: Required
- **Response**: Current user information

### Users

#### Get User Profile

- **GET** `/users/me`
- **Auth**: Required
- **Response**: User profile data

### Tips

#### Create Tip

- **POST** `/tips`
- **Auth**: Not required (public endpoint)
- **Body**:

```json
{
  "toHandle": "recipient_handle",
  "amountCents": 500,
  "message": "Optional message",
  "fromEmail": "optional@email.com"
}
```

- **Response**: Created tip with fee calculation

#### Get Incoming Tips

- **GET** `/tips/incoming`
- **Auth**: Required
- **Response**: List of tips received by authenticated user

#### Get Outgoing Tips

- **GET** `/tips/outgoing`
- **Auth**: Required
- **Response**: List of tips sent by authenticated user

### QR Codes

#### Generate QR Code

- **GET** `/qr/:handle`
- **Description**: Generates QR code PNG for user's tip portal
- **Response**: PNG image (Content-Type: image/png)

### Portal

#### Tip Portal

- **GET** `/portal/:handle`
- **Description**: HTML form for sending tips to a user
- **Response**: Complete HTML page with tip form

### Payouts

#### Request Payout

- **POST** `/payouts/request`
- **Auth**: Required
- **Body**:

```json
{
  "amountCents": 400
}
```

- **Response**: Created payout request

#### List My Payouts

- **GET** `/payouts`
- **Auth**: Required
- **Response**: List of user's payout requests

### Admin (Admin Role Required)

#### List All Users

- **GET** `/admin/users`
- **Auth**: Admin required
- **Response**: List of all users

#### List All Tips

- **GET** `/admin/tips`
- **Auth**: Admin required
- **Response**: List of all tips

#### Update Tip Status

- **PATCH** `/admin/tips/:id/status`
- **Auth**: Admin required
- **Body**: Status update data

#### List All Payouts

- **GET** `/admin/payouts`
- **Auth**: Admin required
- **Response**: List of all payouts

#### Update Payout Status

- **PATCH** `/admin/payouts/:id/status`
- **Auth**: Admin required
- **Body**: Status update data

## Error Responses

### 400 Bad Request

```json
{
  "error": {
    "formErrors": [],
    "fieldErrors": {
      "field": ["Error message"]
    }
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Missing Authorization header"
}
```

### 403 Forbidden

```json
{
  "error": "Admin only"
}
```

### 404 Not Found

```json
{
  "error": "User not found"
}
```

### 409 Conflict

```json
{
  "error": "Email already in use"
}
```

## Fee Structure

- Service fee: Calculated as a percentage of tip amount
- Example: $5.00 tip = 500 cents, fee = 12 cents, net = 488 cents

## User Roles

- **CUSTOMER**: Can send and receive tips
- **BARISTA**: Can send and receive tips, request payouts
- **ADMIN**: Full access to admin endpoints

## Status Values

### Tip Status

- `PENDING`: Tip created but payment not processed
- `COMPLETED`: Tip successfully processed
- `FAILED`: Tip processing failed

### Payout Status

- `REQUESTED`: Payout requested by user
- `PROCESSING`: Payout being processed
- `PAID`: Payout completed
- `FAILED`: Payout failed
