#!/bin/bash

# Acadex Mini Microservices Setup Script
# This script automates the initial setup process

set -e

echo "🚀 Acadex Mini Microservices Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. You'll need to install MySQL manually"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed"
    fi
    
    print_status "Prerequisites check completed"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        cp .env.example .env
        print_status "Created .env file from template"
        print_warning "Please edit .env file with your configuration"
    else
        print_status ".env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install service dependencies
    npm run install:all
    
    print_status "Dependencies installed successfully"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if Docker is available
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_status "Using Docker for database setup..."
        
        # Start MySQL and Redis
        docker-compose up mysql redis -d
        
        # Wait for MySQL to be ready
        print_status "Waiting for MySQL to be ready..."
        sleep 30
        
        # Run database setup
        npm run db:setup
        
    else
        print_warning "Docker not available. Please set up MySQL manually:"
        echo "1. Install MySQL 8.0+"
        echo "2. Create databases: auth_db, class_db, assignment_db, grading_db, file_db, subscription_db, notification_db, analytics_db"
        echo "3. Create user 'acadex' with password 'acadex123'"
        echo "4. Grant privileges to the user"
        echo "5. Run: npm run db:migrate"
    fi
}

# Test services
test_services() {
    print_status "Testing services..."
    
    # Wait a bit for services to start
    sleep 5
    
    # Test health endpoints
    services=(
        "http://localhost:3001/health"
        "http://localhost:3002/health"
        "http://localhost:3003/health"
        "http://localhost:3004/health"
        "http://localhost:3005/health"
        "http://localhost:3006/health"
        "http://localhost:3007/health"
        "http://localhost:3008/health"
        "http://localhost:3000/health"
    )
    
    for service in "${services[@]}"; do
        if curl -f "$service" > /dev/null 2>&1; then
            print_status "✅ $service is responding"
        else
            print_warning "⚠️  $service is not responding"
        fi
    done
}

# Main setup function
main() {
    echo ""
    print_status "Starting Acadex Mini Microservices setup..."
    echo ""
    
    # Check prerequisites
    check_prerequisites
    echo ""
    
    # Setup environment
    setup_environment
    echo ""
    
    # Install dependencies
    install_dependencies
    echo ""
    
    # Setup database
    setup_database
    echo ""
    
    print_status "Setup completed successfully!"
    echo ""
    
    print_status "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Start services: npm run dev:all"
    echo "3. Test services: npm run health:check"
    echo "4. View logs: npm run logs:all"
    echo ""
    
    print_status "Quick commands:"
    echo "- Start all services: npm run dev:all"
    echo "- Check health: npm run health:check"
    echo "- View logs: npm run logs:all"
    echo "- Stop services: Ctrl+C"
    echo ""
    
    print_status "Documentation:"
    echo "- README.md: Complete architecture overview"
    echo "- DEPLOYMENT.md: Detailed deployment guide"
    echo ""
}

# Run main function
main "$@" 