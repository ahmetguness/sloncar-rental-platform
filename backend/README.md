# Rent-a-Car Backend API

Production-ready REST API backend for a car rental system with franchise management capabilities.

## Tech Stack

- **Runtime**: Node.js 20+ with TypeScript (ESM)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **Authentication**: JWT (role-based: USER, ADMIN)
- **Documentation**: OpenAPI/Swagger
- **Testing**: Vitest + Supertest
- **Containerization**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm or yarn

### Setup

```bash
# Clone and navigate
cd backend

# Copy environment file
cp .env.example .env

# Start PostgreSQL with Docker
docker-compose up -d postgres

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

### Using Docker Compose (Full Stack)

```bash
# Build and start everything
docker-compose up --build

# The app will automatically run migrations
```

## API Documentation

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

## Database

### Migrations

```bash
# Create new migration
npm run db:migrate

# Apply migrations (production)
npm run db:migrate:prod

# Push schema without migration
npm run db:push

# Open Prisma Studio
npm run db:studio
```

### Schema Design

**Hybrid JSONB Approach for Franchise Applications**:
- Normalized columns for frequently queried fields (status, city, dates)
- JSONB `details` column for extensible form sections
- Benefits: Query performance + schema flexibility

## Test Credentials

```
Admin: admin@rentacar.com / password123
User:  user@example.com / password123
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get current user profile |

### Cars

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cars` | - | List cars (filters + pagination) |
| GET | `/api/cars/:id` | - | Get car details |
| GET | `/api/cars/:id/availability` | - | Get availability calendar |
| POST | `/api/cars` | Admin | Create car |
| PATCH | `/api/cars/:id` | Admin | Update car |
| DELETE | `/api/cars/:id` | Admin | Delete car |

**Query Parameters for GET /api/cars**:
- `brand`, `category`, `transmission`, `fuel` - Filter by value
- `minPrice`, `maxPrice` - Price range
- `minYear`, `maxYear` - Year range
- `branch` - Branch ID
- `seats` - Minimum seats
- `q` - Search brand/model
- `page`, `limit` - Pagination
- `sortBy`, `sortOrder` - Sorting

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings` | Optional | Create reservation |
| GET | `/api/bookings/me` | User | Get user's bookings |
| PATCH | `/api/bookings/:id/cancel` | User | Cancel booking |
| GET | `/api/admin/bookings` | Admin | List all bookings |

### Franchise Applications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/franchise-applications` | User | Create draft |
| PATCH | `/api/franchise-applications/:id` | User | Update draft |
| POST | `/api/franchise-applications/:id/submit` | User | Submit for review |
| GET | `/api/franchise-applications/me` | User | Get user's applications |
| GET | `/api/admin/franchise-applications` | Admin | List all applications |
| GET | `/api/admin/franchise-applications/:id` | Admin | Get with audit log |
| PATCH | `/api/admin/franchise-applications/:id/status` | Admin | Approve/Reject |
| GET | `/api/admin/franchise-applications/:id/audit` | Admin | Get audit trail |

## curl Examples

### Register & Login

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Save token for future requests
TOKEN="<token-from-login-response>"
```

### Cars

```bash
# List cars with filters
curl "http://localhost:3000/api/cars?category=SUV&minPrice=500&page=1&limit=10"

# Search cars
curl "http://localhost:3000/api/cars?q=Toyota"

# Get car availability
curl "http://localhost:3000/api/cars/{carId}/availability?from=2024-03-01&to=2024-03-31"

# Create car (admin)
curl -X POST http://localhost:3000/api/cars \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2024,
    "transmission": "AUTO",
    "fuel": "HYBRID",
    "category": "COMPACT",
    "seats": 5,
    "doors": 4,
    "color": "Silver",
    "plateNumber": "34 NEW 001",
    "dailyPrice": 600,
    "mileage": 0,
    "branchId": "<branch-uuid>"
  }'
```

### Bookings

```bash
# Create booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "carId": "<car-uuid>",
    "customerName": "John Doe",
    "customerPhone": "+90 555 123 4567",
    "pickupDate": "2024-03-10",
    "dropoffDate": "2024-03-15",
    "pickupBranchId": "<branch-uuid>",
    "dropoffBranchId": "<branch-uuid>"
  }'

# Get my bookings
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/bookings/me"

# Cancel booking
curl -X PATCH http://localhost:3000/api/bookings/{bookingId}/cancel \
  -H "Authorization: Bearer $TOKEN"
```

### Franchise Applications

```bash
# Create draft application
curl -X POST http://localhost:3000/api/franchise-applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactName": "John Doe",
    "contactEmail": "john@example.com",
    "contactPhone": "+90 555 111 2222",
    "city": "Antalya",
    "details": {
      "personalInfo": {
        "fullName": "John Doe",
        "address": "123 Main St"
      },
      "companyInfo": {
        "legalName": "JD Motors Ltd"
      }
    }
  }'

# Update draft
curl -X PATCH http://localhost:3000/api/franchise-applications/{appId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "details": {
      "fleetPlan": {
        "initialFleetSize": 25,
        "economyCars": 15
      }
    }
  }'

# Submit application
curl -X POST http://localhost:3000/api/franchise-applications/{appId}/submit \
  -H "Authorization: Bearer $TOKEN"

# Admin: Update status
curl -X PATCH http://localhost:3000/api/admin/franchise-applications/{appId}/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "adminNote": "Application approved. Welcome to the franchise!"
  }'
```

## Availability Calendar Response Example

```json
{
  "success": true,
  "data": {
    "carId": "uuid",
    "from": "2024-03-01",
    "to": "2024-03-31",
    "calendar": [
      { "date": "2024-03-01", "status": "available" },
      { "date": "2024-03-02", "status": "booked", "bookingId": "uuid" },
      { "date": "2024-03-03", "status": "booked", "bookingId": "uuid" }
    ],
    "ranges": [
      { "from": "2024-03-01", "to": "2024-03-01", "status": "available" },
      { "from": "2024-03-02", "to": "2024-03-05", "status": "booked", "bookingId": "uuid" },
      { "from": "2024-03-06", "to": "2024-03-31", "status": "available" }
    ]
  }
}
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # Entry point
│   ├── config/
│   │   ├── env.ts             # Environment validation
│   │   └── swagger.ts         # OpenAPI config
│   ├── middlewares/
│   │   ├── errorHandler.ts    # Error handling
│   │   ├── auth.ts            # JWT verification
│   │   ├── adminGuard.ts      # Admin role check
│   │   ├── validate.ts        # Zod validation
│   │   └── requestLogger.ts   # Request logging
│   ├── modules/
│   │   ├── auth/              # Authentication
│   │   ├── cars/              # Car management
│   │   ├── bookings/          # Booking management
│   │   └── franchise/         # Franchise applications
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   └── jwt.ts             # JWT utilities
│   └── types/
│       └── express.d.ts       # Type extensions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── tests/
│   ├── setup.ts
│   ├── auth.test.ts
│   ├── cars.test.ts
│   └── bookings.test.ts
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `APP_PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `CORS_ORIGIN` | Allowed origins | * |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## License

MIT
