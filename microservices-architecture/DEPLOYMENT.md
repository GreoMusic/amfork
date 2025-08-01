# Acadex Mini Microservices - Deployment Guide

## 🚀 **Quick Start for Your Team**

### **Prerequisites**
- Node.js 18+ installed
- Docker and Docker Compose installed
- MySQL 8.0+ (or use Docker)
- Git installed
- Railway CLI (for deployment)

---

## 📋 **Step 1: Clone and Setup**

```bash
# Clone the repository
git clone <your-repo-url>
cd microservices-architecture

# Install dependencies for all services
npm run install:all
```

---

## 🔧 **Step 2: Environment Configuration**

### **Create Environment Files**

1. **Copy environment template:**
```bash
cp .env.example .env
```

2. **Edit `.env` with your configuration:**
```bash
# Database Configuration
DATABASE_URL="mysql://acadex:acadex123@localhost:3306/acadex_mini"
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"

# Service URLs (for local development)
AUTH_SERVICE_URL="http://localhost:3001"
CLASS_SERVICE_URL="http://localhost:3002"
ASSIGNMENT_SERVICE_URL="http://localhost:3003"
GRADING_SERVICE_URL="http://localhost:3004"
FILE_SERVICE_URL="http://localhost:3005"
SUBSCRIPTION_SERVICE_URL="http://localhost:3006"
NOTIFICATION_SERVICE_URL="http://localhost:3007"
ANALYTICS_SERVICE_URL="http://localhost:3008"

# External Services
OPENAI_API_KEY="your-openai-api-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
```

---

## 🗄️ **Step 3: Database Setup**

### **Option A: Using Docker (Recommended)**

```bash
# Start MySQL and Redis with Docker
docker-compose up mysql redis -d

# Wait for MySQL to be ready (about 30 seconds)
sleep 30

# Run database migrations
npm run db:setup
```

### **Option B: Local MySQL**

```bash
# Create databases manually
mysql -u root -p
```

```sql
CREATE DATABASE auth_db;
CREATE DATABASE class_db;
CREATE DATABASE assignment_db;
CREATE DATABASE grading_db;
CREATE DATABASE file_db;
CREATE DATABASE subscription_db;
CREATE DATABASE notification_db;
CREATE DATABASE analytics_db;

CREATE USER 'acadex'@'localhost' IDENTIFIED BY 'acadex123';
GRANT ALL PRIVILEGES ON *.* TO 'acadex'@'localhost';
FLUSH PRIVILEGES;
```

---

## 🏃‍♂️ **Step 4: Start Services**

### **Development Mode (All Services)**
```bash
# Start all services in development mode
npm run dev:all
```

### **Production Mode (All Services)**
```bash
# Start all services in production mode
npm run start:all
```

### **Individual Services**
```bash
# Start specific services
npm run dev:auth
npm run dev:class
npm run dev:assignment
# ... etc
```

---

## 🧪 **Step 5: Testing**

### **Health Checks**
```bash
# Check if all services are running
npm run health:check
```

### **Run Tests**
```bash
# Run all tests
npm run test:all

# Run tests for specific service
npm run test:auth
npm run test:class
# ... etc
```

---

## 🐳 **Step 6: Docker Development**

### **Start All Services with Docker**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### **Individual Service with Docker**
```bash
# Start specific service
docker-compose up auth-service -d

# View logs for specific service
docker-compose logs auth-service -f
```

---

## ☁️ **Step 7: Production Deployment**

### **Railway Deployment (Recommended)**

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```

3. **Deploy All Services:**
```bash
# Deploy all services to Railway
npm run deploy:all
```

4. **Deploy Individual Services:**
```bash
# Deploy specific service
npm run deploy:auth
npm run deploy:class
# ... etc
```

### **Fly.io Deployment (for AI Services)**

1. **Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login to Fly:**
```bash
fly auth login
```

3. **Deploy Grading Service:**
```bash
cd services/grading-service
fly deploy
```

---

## 🔍 **Step 8: Monitoring and Logs**

### **View All Logs**
```bash
# View logs for all services
npm run logs:all
```

### **View Individual Service Logs**
```bash
# View logs for specific service
npm run logs:auth
npm run logs:class
# ... etc
```

### **Health Monitoring**
```bash
# Check service health
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Class Service
# ... etc
```

---

## 🔐 **Step 9: Security Configuration**

### **JWT Secret**
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **API Keys**
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/)
- **Stripe Keys**: Get from [Stripe Dashboard](https://dashboard.stripe.com/)
- **AWS Keys**: Get from [AWS Console](https://aws.amazon.com/)

---

## 🚨 **Step 10: Troubleshooting**

### **Common Issues**

1. **Port Already in Use:**
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
```

2. **Database Connection Issues:**
```bash
# Check MySQL status
sudo systemctl status mysql
# Restart MySQL
sudo systemctl restart mysql
```

3. **Service Not Starting:**
```bash
# Check logs
npm run logs:auth
# Check environment variables
echo $DATABASE_URL
```

4. **Docker Issues:**
```bash
# Clean up Docker
docker system prune -a
# Rebuild containers
docker-compose build --no-cache
```

---

## 📊 **Step 11: Performance Monitoring**

### **Service Metrics**
```bash
# Check service response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3001/health"
```

### **Database Performance**
```bash
# Check MySQL performance
mysql -u root -p -e "SHOW PROCESSLIST;"
```

---

## 🔄 **Step 12: Updates and Maintenance**

### **Update Dependencies**
```bash
# Update all services
npm run install:all
```

### **Database Migrations**
```bash
# Run migrations for all services
npm run db:migrate
```

### **Service Restart**
```bash
# Restart all services
npm run start:all
```

---

## 📞 **Support and Documentation**

### **API Documentation**
- **Swagger UI**: Available at `/docs` for each service
- **Health Checks**: Available at `/health` for each service

### **Logs Location**
- **Development**: Console output
- **Production**: `logs/` directory in each service
- **Docker**: `docker-compose logs -f`

### **Monitoring URLs**
- **API Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **Class Service**: http://localhost:3002
- **Assignment Service**: http://localhost:3003
- **Grading Service**: http://localhost:3004
- **File Service**: http://localhost:3005
- **Subscription Service**: http://localhost:3006
- **Notification Service**: http://localhost:3007
- **Analytics Service**: http://localhost:3008

---

## 🎯 **Quick Commands Reference**

```bash
# Development
npm run dev:all          # Start all services in dev mode
npm run start:all        # Start all services in prod mode
npm run health:check     # Check all services health
npm run logs:all         # View all service logs

# Database
npm run db:setup         # Setup databases and run migrations
npm run db:migrate       # Run all migrations

# Testing
npm run test:all         # Run all tests
npm run test:integration # Run integration tests

# Deployment
npm run deploy:all       # Deploy all services to Railway
docker-compose up -d     # Start all services with Docker

# Troubleshooting
npm run logs:auth        # View auth service logs
docker-compose logs -f   # View Docker logs
```

---

## ✅ **Verification Checklist**

- [ ] All services are running (`npm run health:check`)
- [ ] Database connections are working
- [ ] API Gateway is accessible at http://localhost:3000
- [ ] Authentication is working
- [ ] File uploads are working
- [ ] Grading service is responding
- [ ] Notifications are being sent
- [ ] Analytics are being collected
- [ ] All tests are passing (`npm run test:all`)

---

## 🚀 **Next Steps**

1. **Review the architecture** and understand service boundaries
2. **Set up monitoring** and alerting
3. **Configure CI/CD** pipelines
4. **Implement message queues** for async communication
5. **Add load balancing** for production
6. **Set up backup strategies** for databases
7. **Implement security scanning** and vulnerability testing

This deployment guide provides everything your team needs to get the microservices architecture up and running quickly! 