// API Gateway - Central Entry Point for All Microservices

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const winston = require('winston');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// LOGGING SETUP
// =============================================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/api-gateway.log' })
  ]
});

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// MICROSERVICES CONFIGURATION
// =============================================================================

const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  CLASS: process.env.CLASS_SERVICE_URL || 'http://localhost:3002',
  ASSIGNMENT: process.env.ASSIGNMENT_SERVICE_URL || 'http://localhost:3003',
  GRADING: process.env.GRADING_SERVICE_URL || 'http://localhost:3004',
  FILE: process.env.FILE_SERVICE_URL || 'http://localhost:3005',
  SUBSCRIPTION: process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3006',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
  ANALYTICS: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008'
};

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// =============================================================================
// PROXY CONFIGURATIONS
// =============================================================================

// Auth Service Proxy
const authProxy = createProxyMiddleware({
  target: SERVICES.AUTH,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Auth Service: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error('Auth Service Error:', err);
    res.status(500).json({ error: 'Auth service unavailable' });
  }
});

// Class Service Proxy
const classProxy = createProxyMiddleware({
  target: SERVICES.CLASS,
  changeOrigin: true,
  pathRewrite: {
    '^/api/classes': '/api/classes'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Class Service: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error('Class Service Error:', err);
    res.status(500).json({ error: 'Class service unavailable' });
  }
});

// Assignment Service Proxy
const assignmentProxy = createProxyMiddleware({
  target: SERVICES.ASSIGNMENT,
  changeOrigin: true,
  pathRewrite: {
    '^/api/assignments': '/api/assignments'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Assignment Service: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error('Assignment Service Error:', err);
    res.status(500).json({ error: 'Assignment service unavailable' });
  }
});

// Grading Service Proxy
const gradingProxy = createProxyMiddleware({
  target: SERVICES.GRADING,
  changeOrigin: true,
  pathRewrite: {
    '^/api/grading': '/api/grading'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Grading Service: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error('Grading Service Error:', err);
    res.status(500).json({ error: 'Grading service unavailable' });
  }
});

// File Service Proxy
const fileProxy = createProxyMiddleware({
  target: SERVICES.FILE,
  changeOrigin: true,
  pathRewrite: {
    '^/api/files': '/api/files'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`File Service: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error('File Service Error:', err);
    res.status(500).json({ error: 'File service unavailable' });
  }
});

// Subscription Service Proxy
const subscriptionProxy = createProxyMiddleware({
  target: SERVICES.SUBSCRIPTION,
  changeOrigin: true,
  pathRewrite: {
    '^/api/subscriptions': '/api/subscriptions'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Subscription Service: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error('Subscription Service Error:', err);
    res.status(500).json({ error: 'Subscription service unavailable' });
  }
});

// Notification Service Proxy
const notificationProxy = createProxyMiddleware({
  target: SERVICES.NOTIFICATION,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/api/notifications'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Notification Service: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error('Notification Service Error:', err);
    res.status(500).json({ error: 'Notification service unavailable' });
  }
});

// Analytics Service Proxy
const analyticsProxy = createProxyMiddleware({
  target: SERVICES.ANALYTICS,
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics': '/api/analytics'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Analytics Service: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    logger.error('Analytics Service Error:', err);
    res.status(500).json({ error: 'Analytics service unavailable' });
  }
});

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: Object.keys(SERVICES)
  });
});

// Auth routes (no authentication required)
app.use('/api/auth', authProxy);

// Protected routes
app.use('/api/classes', authenticateToken, classProxy);
app.use('/api/assignments', authenticateToken, assignmentProxy);
app.use('/api/grading', authenticateToken, gradingProxy);
app.use('/api/files', authenticateToken, fileProxy);
app.use('/api/subscriptions', authenticateToken, subscriptionProxy);
app.use('/api/notifications', authenticateToken, notificationProxy);
app.use('/api/analytics', authenticateToken, analyticsProxy);

// User profile routes
app.use('/api/users', authenticateToken, authProxy);

// =============================================================================
// CROSS-SERVICE COMMUNICATION ENDPOINTS
// =============================================================================

// Teacher creates assignment -> notify students
app.post('/api/assignments/:assignmentId/notify-students', authenticateToken, requireRole(['EDUCATOR', 'ADMIN']), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { classId, assignmentTitle } = req.body;

    // Get students in the class
    const classResponse = await fetch(`${SERVICES.CLASS}/api/classes/${classId}/students`, {
      headers: { 'Authorization': req.headers.authorization }
    });
    const students = await classResponse.json();

    // Send notifications to all students
    const notificationPromises = students.map(student => 
      fetch(`${SERVICES.NOTIFICATION}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization
        },
        body: JSON.stringify({
          userId: student.id,
          type: 'NEW_ASSIGNMENT',
          title: 'New Assignment Available',
          message: `A new assignment "${assignmentTitle}" is now available in your class.`,
          data: { assignmentId, classId }
        })
      })
    );

    await Promise.all(notificationPromises);
    res.json({ message: 'Students notified successfully' });
  } catch (error) {
    logger.error('Error notifying students:', error);
    res.status(500).json({ error: 'Failed to notify students' });
  }
});

// LISA AI feedback -> send to teacher
app.post('/api/grading/lisa-feedback-to-teacher', authenticateToken, requireRole(['STUDENT']), async (req, res) => {
  try {
    const { teacherId, classId, assignmentId, feedback, studentId } = req.body;

    // Send feedback to teacher's notification
    await fetch(`${SERVICES.NOTIFICATION}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify({
        userId: teacherId,
        type: 'LISA_FEEDBACK',
        title: 'LISA AI Feedback',
        message: `LISA AI provided feedback to a student in your class.`,
        data: { 
          classId, 
          assignmentId, 
          studentId, 
          feedback,
          timestamp: new Date().toISOString()
        }
      })
    });

    res.json({ message: 'Feedback sent to teacher' });
  } catch (error) {
    logger.error('Error sending LISA feedback to teacher:', error);
    res.status(500).json({ error: 'Failed to send feedback to teacher' });
  }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((err, req, res, next) => {
  logger.error('API Gateway Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Available services:', Object.keys(SERVICES));
});

module.exports = app; 