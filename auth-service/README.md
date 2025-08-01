# Auth Service - Acadex Mini

Authentication microservice for the Acadex Mini platform. Handles user registration, login, password management, and JWT token authentication.

## 🚀 Features

- **User Authentication**: Register, login, logout with JWT tokens
- **Password Management**: Secure password hashing, reset, and change functionality
- **Email Verification**: Email-based account verification
- **Role-Based Access**: Support for EDUCATOR, STUDENT, and ADMIN roles
- **Security**: Rate limiting, CORS, helmet security headers
- **Database**: MySQL with Prisma ORM
- **Logging**: Structured logging with Winston

## 📋 Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## 🛠️ Installation

1. **Clone and navigate to the service:**
   ```bash
   cd auth-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database:**
   ```bash
   # Generate Prisma client
   npm run generate
   
   # Run database migrations
   npm run migrate
   ```

5. **Start the service:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | MySQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `SMTP_HOST` | SMTP server host | Required |
| `SMTP_USER` | SMTP username | Required |
| `SMTP_PASS` | SMTP password | Required |
| `FRONTEND_URL` | Frontend URL for email links | Required |

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EDUCATOR",
  "organizationId": 1
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Logout User
```http
POST /api/auth/logout
Content-Type: application/json
Authorization: Bearer <token>

{
  "refreshToken": "refresh-token-here"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token-here"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "password": "newpassword123"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-here"
}
```

### User Management Endpoints

#### Get Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "organizationId": 2
}
```

#### Change Password
```http
POST /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

## 🔐 Authentication

The service uses JWT tokens for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Structure
```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "role": "EDUCATOR",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## 🗄️ Database Schema

### Users Table
- `id` - Unique user identifier
- `email` - User email (unique)
- `password` - Hashed password
- `firstName` - User's first name
- `lastName` - User's last name
- `role` - User role (EDUCATOR, STUDENT, ADMIN)
- `organizationId` - Organization ID (optional)
- `emailVerified` - Email verification status
- `isActive` - Account active status
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Sessions Table
- `id` - Session identifier
- `userId` - User ID (foreign key)
- `token` - Session token
- `expiresAt` - Token expiration
- `createdAt` - Session creation timestamp

### Refresh Tokens Table
- `id` - Token identifier
- `userId` - User ID (foreign key)
- `token` - Refresh token
- `expiresAt` - Token expiration
- `createdAt` - Token creation timestamp

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Logging

The service uses Winston for structured logging. Logs are written to:
- Console (development)
- `logs/combined.log` (all levels)
- `logs/error.log` (error level only)

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Input Validation**: Express-validator middleware
- **SQL Injection Protection**: Prisma ORM

## 🚀 Deployment

### Railway.app
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Docker
```bash
# Build image
docker build -t auth-service .

# Run container
docker run -p 3001:3001 --env-file .env auth-service
```

## 🔗 Integration with Other Services

This service will be used by:
- **Teacher Frontend** (acadex-mini-main)
- **Student Frontend** (AMSS)
- **API Gateway** (future)
- **Other Microservices** (Class, Assignment, etc.)

## 📞 Support

For issues and questions:
- Check the logs in `logs/` directory
- Review the API documentation above
- Contact the development team

## 📄 License

MIT License - see LICENSE file for details. 