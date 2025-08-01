// student-api.js - AMSS Student Side API Integration

// Microservices configuration for student side
const MICROSERVICES_CONFIG = {
  development: {
    AUTH_SERVICE: 'http://localhost:3001',
    CLASS_SERVICE: 'http://localhost:3002',
    ASSIGNMENT_SERVICE: 'http://localhost:3003',
    GRADING_SERVICE: 'http://localhost:3004',
    FILE_SERVICE: 'http://localhost:3005',
    LISA_SERVICE: 'http://localhost:3004', // LISA AI runs on grading service
    API_GATEWAY: 'http://localhost:3000'
  },
  production: {
    AUTH_SERVICE: 'https://auth-service.railway.app',
    CLASS_SERVICE: 'https://class-service.railway.app',
    ASSIGNMENT_SERVICE: 'https://assignment-service.railway.app',
    GRADING_SERVICE: 'https://grading-service.fly.dev',
    FILE_SERVICE: 'https://file-service.railway.app',
    LISA_SERVICE: 'https://grading-service.fly.dev',
    API_GATEWAY: 'https://api-gateway.railway.app'
  }
};

const environment = window.location.hostname === 'localhost' ? 'development' : 'production';
const SERVICES = MICROSERVICES_CONFIG[environment];

// =============================================================================
// STUDENT AUTHENTICATION
// =============================================================================

export const studentLogin = async (credentials) => {
  try {
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...credentials, role: 'STUDENT' })
    });
    return await response.json();
  } catch (error) {
    console.error('Student login error:', error);
    throw error;
  }
};

export const studentRegister = async (userData) => {
  try {
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, role: 'STUDENT' })
    });
    return await response.json();
  } catch (error) {
    console.error('Student registration error:', error);
    throw error;
  }
};

// =============================================================================
// CLASS ENROLLMENT
// =============================================================================

export const joinClassWithQR = async (qrCode) => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.CLASS_SERVICE}/api/classes/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ qrCode })
    });
    return await response.json();
  } catch (error) {
    console.error('Join class error:', error);
    throw error;
  }
};

export const joinClassWithCode = async (classCode) => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.CLASS_SERVICE}/api/classes/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ classCode })
    });
    return await response.json();
  } catch (error) {
    console.error('Join class error:', error);
    throw error;
  }
};

export const getStudentClasses = async () => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.CLASS_SERVICE}/api/classes/my`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Get student classes error:', error);
    throw error;
  }
};

// =============================================================================
// ASSIGNMENTS
// =============================================================================

export const getStudentAssignments = async (classId) => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.ASSIGNMENT_SERVICE}/api/assignments/class/${classId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Get assignments error:', error);
    throw error;
  }
};

export const submitAssignment = async (assignmentId, submissionData) => {
  try {
    const token = localStorage.getItem('student_token');
    const formData = new FormData();
    
    // Add file if present
    if (submissionData.file) {
      formData.append('file', submissionData.file);
    }
    
    // Add other submission data
    formData.append('title', submissionData.title);
    formData.append('content', submissionData.content);
    
    const response = await fetch(`${SERVICES.ASSIGNMENT_SERVICE}/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Submit assignment error:', error);
    throw error;
  }
};

// =============================================================================
// LISA AI INTEGRATION
// =============================================================================

export const getLisaPrompt = async (context) => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.LISA_SERVICE}/api/grading/lisa-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(context)
    });
    return await response.json();
  } catch (error) {
    console.error('LISA prompt error:', error);
    throw error;
  }
};

export const sendLisaFeedback = async (feedbackData) => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.LISA_SERVICE}/api/grading/lisa-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(feedbackData)
    });
    return await response.json();
  } catch (error) {
    console.error('LISA feedback error:', error);
    throw error;
  }
};

// Send LISA's exact words to teacher
export const sendLisaExactWordsToTeacher = async (lisaData) => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.API_GATEWAY}/api/grading/lisa-feedback-to-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        teacherId: lisaData.teacherId,
        classId: lisaData.classId,
        assignmentId: lisaData.assignmentId,
        studentId: lisaData.studentId,
        lisaExactWords: lisaData.lisaExactWords,        // Exact words LISA said
        studentContext: lisaData.studentContext,         // What student was writing
        feedbackType: lisaData.feedbackType,            // Type of feedback
        confidence: lisaData.confidence,                // AI confidence
        timestamp: new Date().toISOString()
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending LISA exact words to teacher:', error);
    throw error;
  }
};

// Send student's response to LISA back to teacher
export const sendStudentResponseToLisa = async (responseData) => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.API_GATEWAY}/api/grading/student-response-to-lisa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        teacherId: responseData.teacherId,
        classId: responseData.classId,
        assignmentId: responseData.assignmentId,
        studentId: responseData.studentId,
        lisaFeedbackId: responseData.lisaFeedbackId,
        studentResponse: responseData.studentResponse,    // Student's exact words back
        studentAction: responseData.studentAction,        // What they did
        updatedText: responseData.updatedText,           // Revised text
        timestamp: new Date().toISOString()
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending student response to teacher:', error);
    throw error;
  }
};

// =============================================================================
// REAL-TIME COMMUNICATION
// =============================================================================

export const connectToClass = async (classId) => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.CLASS_SERVICE}/api/classes/${classId}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Connect to class error:', error);
    throw error;
  }
};

// =============================================================================
// STUDENT PROFILE
// =============================================================================

export const getStudentProfile = async () => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Get student profile error:', error);
    throw error;
  }
};

export const updateStudentProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.AUTH_SERVICE}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    return await response.json();
  } catch (error) {
    console.error('Update student profile error:', error);
    throw error;
  }
};

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export const getStudentNotifications = async () => {
  try {
    const token = localStorage.getItem('student_token');
    const response = await fetch(`${SERVICES.NOTIFICATION_SERVICE}/api/notifications/user-notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Get notifications error:', error);
    throw error;
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const setStudentToken = (token) => {
  localStorage.setItem('student_token', token);
};

export const getStudentToken = () => {
  return localStorage.getItem('student_token');
};

export const removeStudentToken = () => {
  localStorage.removeItem('student_token');
};

export const isStudentLoggedIn = () => {
  return !!getStudentToken();
};

// =============================================================================
// WEBSOCKET CONNECTION FOR REAL-TIME FEATURES
// =============================================================================

export const createWebSocketConnection = (classId) => {
  const token = getStudentToken();
  const wsUrl = environment === 'development' 
    ? `ws://localhost:3002/ws/class/${classId}`
    : `wss://class-service.railway.app/ws/class/${classId}`;
  
  const ws = new WebSocket(`${wsUrl}?token=${token}`);
  
  ws.onopen = () => {
    console.log('Connected to class WebSocket');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('Disconnected from class WebSocket');
  };
  
  return ws;
};

const handleWebSocketMessage = (data) => {
  switch (data.type) {
    case 'new_assignment':
      // Handle new assignment notification
      showNotification('New assignment available!', 'info');
      break;
    case 'lisa_prompt':
      // Handle LISA AI prompt
      showLisaPrompt(data.prompt);
      break;
    case 'grade_update':
      // Handle grade update
      showNotification('Your grade has been updated!', 'success');
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
};

const showNotification = (message, type = 'info') => {
  // Implementation for showing notifications
  console.log(`${type.toUpperCase()}: ${message}`);
};

const showLisaPrompt = (prompt) => {
  // Implementation for showing LISA prompts
  console.log('LISA Prompt:', prompt);
}; 