# Acadex Mini Microservices Architecture

## 🏗️ **Complete Microservice Breakdown**

### **Current Monolith Analysis**
Based on the existing Laravel backend and React frontend, here's the microservice breakdown:

## 📦 **Microservices Overview**

| Service | Port | Database | Responsibility |
|---------|------|----------|----------------|
| **Auth Service** | 3001 | `auth_db` | Authentication, JWT, User Management |
| **Class Service** | 3002 | `class_db` | Classes, Groups, Enrollments |
| **Assignment Service** | 3003 | `assignment_db` | Assignments, Submissions |
| **Grading Service** | 3004 | `grading_db` | AI Grading, LISA AI |
| **File Service** | 3005 | `file_db` | File Upload, Storage, Parsing |
| **Subscription Service** | 3006 | `subscription_db` | Payments, Plans, Billing |
| **Notification Service** | 3007 | `notification_db` | Emails, SMS, Push Notifications |
| **Analytics Service** | 3008 | `analytics_db` | Reports, Usage Stats, Metrics |
| **API Gateway** | 3000 | - | Routing, Load Balancing |

---

## 🚀 **Quick Start for Team**

### **1. Clone and Setup**
```bash
git clone <your-repo>
cd microservices-architecture
```

### **2. Environment Setup**
```bash
# Copy environment templates
cp .env.example .env

# Edit .env with your database URLs
DATABASE_URL="mysql://user:pass@localhost:3306/acadex_mini"
REDIS_URL="redis://localhost:6379"
```

### **3. Database Setup**
```bash
# Create databases
mysql -u root -p
CREATE DATABASE auth_db;
CREATE DATABASE class_db;
CREATE DATABASE assignment_db;
CREATE DATABASE grading_db;
CREATE DATABASE file_db;
CREATE DATABASE subscription_db;
CREATE DATABASE notification_db;
CREATE DATABASE analytics_db;
```

### **4. Start Services**
```bash
# Install dependencies for all services
npm run install:all

# Start all services
npm run start:all

# Or start individually
cd auth-service && npm start
cd class-service && npm start
# ... etc
```

---

## 📁 **Directory Structure**

```
microservices-architecture/
├── services/
│   ├── auth-service/          # Port 3001
│   ├── class-service/         # Port 3002
│   ├── assignment-service/    # Port 3003
│   ├── grading-service/       # Port 3004
│   ├── file-service/          # Port 3005
│   ├── subscription-service/  # Port 3006
│   ├── notification-service/  # Port 3007
│   ├── analytics-service/     # Port 3008
│   └── api-gateway/          # Port 3000
├── shared/
│   ├── middleware/
│   ├── utils/
│   └── types/
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🔧 **Service Details**

### **1. Auth Service (Port 3001)**
**Responsibilities:**
- User registration/login
- JWT token management
- Password reset
- Email verification
- Role-based access control

**Key Endpoints:**
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/profile
```

### **2. Class Service (Port 3002)**
**Responsibilities:**
- Class/group creation
- QR code generation
- Student enrollment
- Class roster management

**Key Endpoints:**
```http
POST /api/classes
GET /api/classes/:id/qr
POST /api/classes/:id/join
GET /api/classes/:id/students
```

### **3. Assignment Service (Port 3003)**
**Responsibilities:**
- Assignment creation
- Submission management
- Due date tracking
- Assignment distribution

**Key Endpoints:**
```http
POST /api/assignments
GET /api/assignments/class/:classId
POST /api/assignments/:id/submit
GET /api/assignments/:id/submissions
```

### **4. Grading Service (Port 3004)**
**Responsibilities:**
- AI-powered grading
- LISA Proactive AI
- Rubric management
- Grade calculation

**Key Endpoints:**
```http
POST /api/grading/evaluate
POST /api/grading/lisa-prompt
GET /api/grading/rubrics
POST /api/grading/pre-analysis
```

### **5. File Service (Port 3005)**
**Responsibilities:**
- File upload handling
- File parsing (PDF, DOCX)
- Storage management
- File metadata

**Key Endpoints:**
```http
POST /api/files/upload
GET /api/files/:id
DELETE /api/files/:id
POST /api/files/parse
```

### **6. Subscription Service (Port 3006)**
**Responsibilities:**
- Package management
- Payment processing (Stripe)
- Usage tracking
- Billing history

**Key Endpoints:**
```http
GET /api/subscriptions/packages
POST /api/subscriptions/create
GET /api/subscriptions/my-subscription
POST /api/subscriptions/check-usage
```

### **7. Notification Service (Port 3007)**
**Responsibilities:**
- Email notifications
- SMS notifications
- Push notifications
- Notification preferences

**Key Endpoints:**
```http
POST /api/notifications/send-email
POST /api/notifications/send-sms
GET /api/notifications/user-notifications
PUT /api/notifications/preferences
```

### **8. Analytics Service (Port 3008)**
**Responsibilities:**
- Usage analytics
- Performance metrics
- Report generation
- Data aggregation

**Key Endpoints:**
```http
POST /api/analytics/track-usage
GET /api/analytics/reports
GET /api/analytics/performance
POST /api/analytics/generate-report
```

### **9. API Gateway (Port 3000)**
**Responsibilities:**
- Route requests to services
- Authentication middleware
- Rate limiting
- Load balancing

**Configuration:**
```javascript
// Route mapping
/api/auth/* → auth-service:3001
/api/classes/* → class-service:3002
/api/assignments/* → assignment-service:3003
/api/grading/* → grading-service:3004
/api/files/* → file-service:3005
/api/subscriptions/* → subscription-service:3006
/api/notifications/* → notification-service:3007
/api/analytics/* → analytics-service:3008
```

---

## 🗄️ **Database Architecture**

### **Shared Database Strategy (Initial)**
```sql
-- Single MySQL instance with separate schemas
CREATE DATABASE auth_db;
CREATE DATABASE class_db;
CREATE DATABASE assignment_db;
CREATE DATABASE grading_db;
CREATE DATABASE file_db;
CREATE DATABASE subscription_db;
CREATE DATABASE notification_db;
CREATE DATABASE analytics_db;
```

### **Future: Database Per Service**
Each service will have its own database instance for complete isolation.

---

## 🔄 **Service Communication**

### **Synchronous (REST)**
- User authentication
- File uploads
- Assignment submissions
- Grade retrieval

### **Asynchronous (Message Queue)**
```javascript
// Events to implement with RabbitMQ/NATS
- user.registered → notification-service
- assignment.created → notification-service
- file.uploaded → grading-service
- grading.completed → analytics-service
- subscription.expired → notification-service
```

---

## 🚀 **Deployment Options**

### **Option 1: Railway.app (Recommended)**
```bash
# Deploy each service to Railway
railway login
railway init
railway up
```

### **Option 2: Docker Compose (Local Development)**
```bash
docker-compose up -d
```

### **Option 3: Individual Hosting**
- **Auth Service**: Railway
- **Class Service**: Railway
- **Grading Service**: Fly.io (for AI processing)
- **File Service**: Railway
- **Database**: PlanetScale (free tier)

---

## 🛠️ **Technology Stack Per Service**

```javascript
// Each service uses:
- Runtime: Node.js 18+
- Framework: Express.js
- Database: MySQL (shared initially)
- ORM: Prisma
- Authentication: JWT
- Validation: Joi or Zod
- Testing: Jest
- Logging: Winston
- Documentation: Swagger/OpenAPI
```

---

## 🔐 **Security Implementation**

### **Service-to-Service Authentication**
```javascript
// API Key authentication
const apiKey = process.env.INTERNAL_API_KEY;
const headers = { 'X-API-Key': apiKey };
```

### **JWT Token Validation**
```javascript
// Validate JWT in each service
const validateToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
```

### **Rate Limiting**
```javascript
// Redis-based rate limiting
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
```

---

## 📊 **Monitoring & Logging**

### **Centralized Logging**
```javascript
// Winston with structured logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});
```

### **Health Checks**
```javascript
// Health check endpoint for each service
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'service-name',
    timestamp: new Date().toISOString()
  });
});
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
```bash
# Run tests for each service
cd auth-service && npm test
cd class-service && npm test
```

### **Integration Tests**
```bash
# Test service communication
npm run test:integration
```

### **End-to-End Tests**
```bash
# Test complete workflows
npm run test:e2e
```

---

## 📈 **Migration Timeline**

### **Phase 1 (Week 1-2): Auth Service**
- ✅ Extract authentication logic
- ✅ Deploy to Railway
- ✅ Update frontend to use new auth endpoints

### **Phase 2 (Week 3-4): Class & Assignment Services**
- ✅ Extract class/assignment management
- ✅ Implement QR code functionality
- ✅ Deploy to Railway

### **Phase 3 (Week 5-6): Grading & File Services**
- ✅ Extract AI grading logic
- ✅ Implement LISA AI service
- ✅ Deploy to Fly.io (for AI processing)

### **Phase 4 (Week 7-8): Remaining Services**
- ✅ Subscription service
- ✅ Notification service
- ✅ Analytics service

### **Phase 5 (Week 9-10): API Gateway**
- ✅ Implement routing
- ✅ Add authentication middleware
- ✅ Deploy to Railway

---

## 🚀 **Quick Deployment Commands**

### **For Your Team:**

1. **Setup Environment:**
```bash
git clone <repo>
cd microservices-architecture
cp .env.example .env
# Edit .env with your database URLs
```

2. **Install Dependencies:**
```bash
npm run install:all
```

3. **Setup Database:**
```bash
npm run db:setup
```

4. **Start Services:**
```bash
# Development
npm run dev:all

# Production
npm run start:all
```

5. **Deploy to Railway:**
```bash
npm run deploy:all
```

---

## 📞 **Support & Documentation**

- **API Documentation**: Swagger UI at `/docs` for each service
- **Health Checks**: `/health` endpoint for each service
- **Logs**: Centralized logging in `logs/` directory
- **Monitoring**: Basic metrics at `/metrics` endpoint

---

## 🎯 **Next Steps for Your Team**

1. **Review the architecture** and understand service boundaries
2. **Set up development environment** with Docker Compose
3. **Deploy Auth Service first** as the foundation
4. **Gradually migrate** other services one by one
5. **Update frontend** to use new microservice endpoints
6. **Add monitoring** and alerting
7. **Implement message queues** for async communication

This architecture provides a scalable, maintainable foundation for Acadex Mini's growth while keeping deployment simple for your team. 