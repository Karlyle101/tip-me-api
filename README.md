# Tip Me API 💰

A modern Node.js API for managing digital tipping services with QR code generation and payment processing.

## 🌟 Features

- **Authentication System**: JWT-based user authentication and authorization
- **QR Code Generation**: Dynamic QR code creation for tip links  
- **User Management**: Profile management with different roles (BARISTA, CUSTOMER, ADMIN)
- **Anonymous Tipping**: Web portal for customers to leave tips without registration
- **Admin Dashboard**: Administrative controls and statistics
- **Tip Processing**: Handle tip transactions and payouts with configurable service fees
- **Portal Interface**: Web portal for service management
- **Production Ready**: Deployed on Azure App Service with CI/CD pipeline

## 🚀 Live Demo

- **API Base URL**: `https://tip-me-api-638958828459649923.azurewebsites.net`
- **Health Check**: `https://tip-me-api-638958828459649923.azurewebsites.net/health`

## 🛠️ Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Prisma ORM with SQLite (PostgreSQL ready)
- **Authentication**: JWT (jsonwebtoken)
- **QR Codes**: qrcode library
- **Validation**: Zod
- **Testing**: Jest
- **Deployment**: Azure App Service
- **CI/CD**: GitHub Actions

## 📋 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user (requires auth)

### QR Code Generation  
- `GET /qr/:handle` - Generate QR code PNG for user handle

### User Management
- `GET /users/me` - Get user profile (requires auth)

### Portal & Tipping
- `GET /portal/:handle` - Anonymous tipping portal (HTML)
- `POST /tips` - Create tip (public endpoint)

### Tips Management
- `GET /tips/incoming` - Get received tips (requires auth)
- `GET /tips/outgoing` - Get sent tips (requires auth)

### Admin Endpoints (requires admin auth)
- `GET /admin/users` - Get all users
- `GET /admin/tips` - Get all tips with status filtering
- `PATCH /admin/tips/:id/status` - Update tip status
- `GET /admin/payouts` - Get all payouts
- `PATCH /admin/payouts/:id/status` - Update payout status

### Payouts
- `POST /payouts/request` - Request payout (requires auth)
- `GET /payouts` - Get user payouts (requires auth)

### Health
- `GET /health` - Service health check

## 🏗️ Project Structure

```
tip-me-api/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── lib/             # Utility libraries
│   ├── tests/           # Test files
│   ├── app.ts           # Express app setup
│   ├── server.ts        # Server entry point
│   └── config.ts        # Configuration
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── dist/                # Compiled JavaScript
└── .github/workflows/   # CI/CD pipeline
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/karlyle101/tip-me-api.git
   cd tip-me-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Test API endpoints
./test-api-endpoints.ps1
```

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | JWT signing secret | Required |
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `SERVICE_FEE_BPS` | Service fee in basis points | `250` (2.5%) |
| `BASE_URL` | Application base URL | `http://localhost:3000` |

## 📦 Deployment

### Azure App Service

This application is deployed on Azure App Service with automatic CI/CD via GitHub Actions.

**Production URL**: `https://tip-me-api-638958828459649923.azurewebsites.net`

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy to Azure
az webapp up --resource-group tip-me-api-rg --name your-app-name
```

## 🔄 CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- **Build**: TypeScript compilation and dependency installation
- **Test**: Automated test suite execution
- **Deploy**: Automatic deployment to Azure App Service on push to main branch

## 💡 Usage Examples

### Register a new barista
```bash
curl -X POST https://tip-me-api-638958828459649923.azurewebsites.net/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "barista@cafe.com", "password": "securepass", "name": "Jane Doe", "handle": "jane-barista"}'
```

### Generate QR code for tips
```bash
# Get QR code PNG for handle "jane-barista"
curl https://tip-me-api-638958828459649923.azurewebsites.net/qr/jane-barista --output qr-code.png
```

### Send anonymous tip
```bash
curl -X POST https://tip-me-api-638958828459649923.azurewebsites.net/tips \
  -H "Content-Type: application/json" \
  -d '{"toHandle": "jane-barista", "amountCents": 500, "message": "Great service!"}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📧 Contact

**Developer**: Karl Sambursley  
**Email**: karlylesambursley@students.utech.edu.jm  
**GitHub**: [@karlyle101](https://github.com/karlyle101)  
**Institution**: University of Technology, Jamaica

## 🙏 Acknowledgments

- Built for hackathon project
- Deployed on Azure for Students
- University of Technology, Jamaica

---

⭐ **Star this repository if you found it helpful!**