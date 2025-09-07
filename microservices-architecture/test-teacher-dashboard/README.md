## Teacher Test Server

Simple mock API for testing the teacher dashboard features without the full backend.

### Run locally
```bash
npm ci
npm run start
# Health
curl http://localhost:3009/health
```

### Endpoints
- GET /api/classes
- GET /api/assignments
- GET /api/submissions
- GET /api/grading-queue
- POST /api/classes
- POST /api/assignments
- POST /api/upload-papers
- GET /api/analytics/overview
- GET /api/subscription/:plan
- GET /api/access/student-side/:plan

# Test Teacher Dashboard

A modern, glass morphism teacher dashboard for testing the Acadex grading system interface.

## Features

- **Modern Glass Morphism UI**: Beautiful, modern interface with glass effects
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Data**: Mock API endpoints for testing
- **Microservice Ready**: Designed to be easily broken into microservices
- **Consistent Design**: Matches the student interface aesthetic

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3009`

### Docker Development

1. Build and run with Docker Compose:
```bash
cd ../..
docker-compose up test-teacher-dashboard
```

2. Access the dashboard at `http://localhost:3009`

## API Endpoints

The test server provides mock API endpoints:

- `GET /api/classes` - List of classes
- `GET /api/assignments/:classId` - Assignments for a class
- `GET /api/submissions/:assignmentId` - Submissions for an assignment
- `GET /health` - Health check endpoint

## Architecture

This dashboard is designed to be easily integrated into the microservice architecture:

### Current Structure
```
test-teacher-dashboard/
├── public/
│   └── index.html          # Main dashboard UI
├── server.js               # Express server with mock APIs
├── package.json            # Dependencies
├── Dockerfile              # Container configuration
└── README.md              # This file
```

### Future Microservice Breakdown
The dashboard can be broken down into these microservices:

1. **Teacher Dashboard Service** (this)
   - UI rendering
   - Navigation
   - State management

2. **Class Management Service**
   - Class CRUD operations
   - Student enrollment
   - Class analytics

3. **Assignment Service**
   - Assignment creation/editing
   - Due date management
   - Submission tracking

4. **Grading Service**
   - Paper upload
   - AI grading
   - Feedback generation

5. **Analytics Service**
   - Performance metrics
   - Grade distributions
   - Progress tracking

## Design System

### Colors
- Primary: `#2A4B7C` (Deep Blue)
- Accent: `#34D399` (Emerald Green)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Amber)
- Danger: `#EF4444` (Red)

### Glass Morphism
- Background: `rgba(255, 255, 255, 0.4)`
- Border: `rgba(255, 255, 255, 0.6)`
- Backdrop Filter: `blur(16px)`

## Development

### Adding New Features

1. **New Views**: Add navigation items and corresponding view divs
2. **API Integration**: Replace mock data with real API calls
3. **Styling**: Use the existing CSS variables for consistency

### Testing

The dashboard includes mock data for testing:
- Sample classes with student counts
- Assignment examples with due dates
- Submission data with grades

## Integration with Main System

To integrate with the main Acadex system:

1. Replace mock API calls with real service calls
2. Add authentication middleware
3. Connect to existing microservices
4. Update environment variables for production

## Contributing

1. Follow the existing glass morphism design pattern
2. Use the established color palette
3. Ensure responsive design
4. Add appropriate loading states
5. Include error handling

## License

MIT License - see main project license 