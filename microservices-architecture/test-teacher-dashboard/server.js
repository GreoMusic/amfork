const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock data
const mockData = {
  classes: [
    {
      id: 1,
      name: 'Advanced Mathematics',
      subject: 'Mathematics',
      studentCount: 24,
      assignments: 5,
      status: 'active',
      description: 'Advanced calculus and linear algebra concepts'
    },
    {
      id: 2,
      name: 'English Literature',
      subject: 'English',
      studentCount: 18,
      assignments: 3,
      status: 'active',
      description: 'Classic and contemporary literature analysis'
    },
    {
      id: 3,
      name: 'Computer Science',
      subject: 'Technology',
      studentCount: 32,
      assignments: 7,
      status: 'active',
      description: 'Programming and software development'
    }
  ],
  assignments: [
    {
      id: 1,
      classId: 1,
      title: 'Calculus Midterm',
      description: 'Comprehensive midterm covering derivatives and integrals',
      dueDate: '2024-02-15',
      submissions: 24,
      graded: 18,
      status: 'active',
      totalPoints: 100
    },
    {
      id: 2,
      classId: 1,
      title: 'Linear Algebra Quiz',
      description: 'Quiz on matrix operations and eigenvalues',
      dueDate: '2024-02-20',
      submissions: 24,
      graded: 24,
      status: 'completed',
      totalPoints: 50
    },
    {
      id: 3,
      classId: 2,
      title: 'Shakespeare Analysis',
      description: 'Critical analysis of Hamlet',
      dueDate: '2024-02-25',
      submissions: 18,
      graded: 12,
      status: 'active',
      totalPoints: 75
    }
  ],
  submissions: [
    {
      id: 1,
      assignmentId: 1,
      studentName: 'Alice Johnson',
      filename: 'calculus_midterm_alice.pdf',
      submittedAt: '2024-02-10T10:30:00Z',
      status: 'pending',
      grade: null,
      score: null,
      totalPoints: 100,
      feedback: null
    },
    {
      id: 2,
      assignmentId: 1,
      studentName: 'Bob Smith',
      filename: 'calculus_midterm_bob.pdf',
      submittedAt: '2024-02-10T11:15:00Z',
      status: 'graded',
      grade: 'A',
      score: 95,
      totalPoints: 100,
      feedback: 'Excellent work on derivatives. Minor errors in integration.'
    },
    {
      id: 3,
      assignmentId: 3,
      studentName: 'Carol Davis',
      filename: 'hamlet_analysis_carol.pdf',
      submittedAt: '2024-02-12T14:20:00Z',
      status: 'in-progress',
      grade: null,
      score: null,
      totalPoints: 75,
      feedback: null
    }
  ],
  gradingQueue: [
    {
      id: 1,
      submissionId: 1,
      title: 'Calculus Midterm - Alice Johnson',
      class: 'Advanced Mathematics',
      priority: 'high',
      submitted: '2 hours ago',
      status: 'pending',
      estimatedTime: '15 minutes'
    },
    {
      id: 2,
      submissionId: 3,
      title: 'Shakespeare Analysis - Carol Davis',
      class: 'English Literature',
      priority: 'medium',
      submitted: '4 hours ago',
      status: 'in-progress',
      estimatedTime: '20 minutes'
    }
  ],
  subscriptions: {
    free: {
      papersLimit: 20,
      assessmentsLimit: 40,
      studentSideAccess: false,
      aiTechnology: 'basic'
    },
    bronze: {
      papersLimit: 100,
      assessmentsLimit: 200,
      studentSideAccess: false,
      aiTechnology: 'advanced'
    },
    silver: {
      papersLimit: -1, // Unlimited
      assessmentsLimit: -1, // Unlimited
      studentSideAccess: false,
      aiTechnology: 'premium'
    },
    gold: {
      papersLimit: -1, // Unlimited
      assessmentsLimit: -1, // Unlimited
      studentSideAccess: true,
      aiTechnology: 'latest'
    }
  }
};

// Subscription-based access control middleware
function checkSubscriptionAccess(plan, feature) {
  const subscription = mockData.subscriptions[plan] || mockData.subscriptions.free;
  
  switch(feature) {
    case 'student-side':
      return subscription.studentSideAccess;
    case 'unlimited-papers':
      return subscription.papersLimit === -1;
    case 'unlimited-assessments':
      return subscription.assessmentsLimit === -1;
    case 'latest-ai':
      return subscription.aiTechnology === 'latest';
    default:
      return true;
  }
}

// API Routes
app.get('/api/classes', (req, res) => {
  res.json(mockData.classes);
});

app.get('/api/assignments', (req, res) => {
  res.json(mockData.assignments);
});

app.get('/api/assignments/:classId', (req, res) => {
  const classId = parseInt(req.params.classId);
  const assignments = mockData.assignments.filter(a => a.classId === classId);
  res.json(assignments);
});

app.get('/api/submissions', (req, res) => {
  res.json(mockData.submissions);
});

app.get('/api/submissions/:assignmentId', (req, res) => {
  const assignmentId = parseInt(req.params.assignmentId);
  const submissions = mockData.submissions.filter(s => s.assignmentId === assignmentId);
  res.json(submissions);
});

app.get('/api/grading-queue', (req, res) => {
  res.json(mockData.gradingQueue);
});

// Subscription endpoints
app.get('/api/subscription/:plan', (req, res) => {
  const plan = req.params.plan;
  const subscription = mockData.subscriptions[plan];
  
  if (!subscription) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  res.json(subscription);
});

app.get('/api/subscription/:plan/features', (req, res) => {
  const plan = req.params.plan;
  const subscription = mockData.subscriptions[plan];
  
  if (!subscription) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  res.json({
    plan,
    features: {
      studentSideAccess: subscription.studentSideAccess,
      unlimitedPapers: subscription.papersLimit === -1,
      unlimitedAssessments: subscription.assessmentsLimit === -1,
      aiTechnology: subscription.aiTechnology,
      papersLimit: subscription.papersLimit,
      assessmentsLimit: subscription.assessmentsLimit
    }
  });
});

// Check if user can access student side
app.get('/api/access/student-side/:plan', (req, res) => {
  const plan = req.params.plan;
  const hasAccess = checkSubscriptionAccess(plan, 'student-side');
  
  res.json({
    plan,
    hasAccess,
    message: hasAccess ? 'Access granted to student side' : 'Student side access requires Gold plan'
  });
});

// Create new class
app.post('/api/classes', (req, res) => {
  console.log('Class creation request received:', req.body);
  
  const { name, subject, description } = req.body;
  
  console.log('Extracted class fields:', { name, subject, description });
  
  const newClass = {
    id: mockData.classes.length + 1,
    name,
    subject,
    description,
    studentCount: 0,
    assignments: 0,
    status: 'active'
  };
  
  console.log('Creating new class:', newClass);
  
  mockData.classes.push(newClass);
  
  console.log('Class created successfully, sending response');
  res.json({
    ...newClass,
    message: `Created a new ${newClass.name} class!`
  });
});

// Legacy endpoint for backward compatibility
app.post('/api/submit/group', (req, res) => {
  console.log('Group submission request received:', req.body);
  
  const { title, criteria, look_out, about_assignment, grade_type, grade_year, total_points, teacher_user_id } = req.body;
  
  console.log('Extracted group fields:', { title, criteria, look_out, about_assignment, grade_type, grade_year, total_points, teacher_user_id });
  
  const newGroup = {
    id: mockData.classes.length + 1,
    name: title,
    subject: grade_year,
    description: about_assignment,
    criteria: criteria,
    look_out: look_out,
    grade_type: grade_type,
    grade_year: grade_year,
    total_points: total_points,
    teacher_user_id: teacher_user_id,
    studentCount: 0,
    assignments: 0,
    status: 'active'
  };
  
  console.log('Creating new group:', newGroup);
  
  mockData.classes.push(newGroup);
  
  console.log('Group created successfully, sending response');
  res.json({
    group: newGroup,
    message: `Created a new ${newGroup.name} class!`
  });
});

// Create new assignment with subscription check
app.post('/api/assignments', (req, res) => {
  console.log('Assignment creation request received:', req.body);
  
  const { title, classId, description, dueDate, totalPoints, plan } = req.body;
  
  console.log('Extracted fields:', { title, classId, description, dueDate, totalPoints, plan });
  
  // Check subscription limits
  const subscription = mockData.subscriptions[plan] || mockData.subscriptions.free;
  const currentAssessments = mockData.assignments.length;
  
  console.log('Subscription check:', { plan, currentAssessments, limit: subscription.assessmentsLimit });
  
  if (subscription.assessmentsLimit !== -1 && currentAssessments >= subscription.assessmentsLimit) {
    console.log('Assessment limit reached');
    return res.status(403).json({
      error: 'Assessment limit reached',
      message: `You have reached your monthly assessment limit of ${subscription.assessmentsLimit}. Please upgrade to continue.`,
      currentPlan: plan,
      limit: subscription.assessmentsLimit
    });
  }
  
  const newAssignment = {
    id: mockData.assignments.length + 1,
    classId: parseInt(classId),
    title,
    description,
    dueDate,
    totalPoints: parseInt(totalPoints),
    submissions: 0,
    graded: 0,
    status: 'active'
  };
  
  console.log('Creating new assignment:', newAssignment);
  
  mockData.assignments.push(newAssignment);
  
  console.log('Assignment created successfully, sending response');
  res.json(newAssignment);
});

// Upload papers with subscription check
app.post('/api/upload-papers', (req, res) => {
  const { classId, assignmentType, dueDate, files, plan } = req.body;
  
  // Check subscription limits
  const subscription = mockData.subscriptions[plan] || mockData.subscriptions.free;
  const currentPapers = mockData.submissions.length;
  
  if (subscription.papersLimit !== -1 && currentPapers >= subscription.papersLimit) {
    return res.status(403).json({
      error: 'Paper limit reached',
      message: `You have reached your monthly paper limit of ${subscription.papersLimit}. Please upgrade to continue.`,
      currentPlan: plan,
      limit: subscription.papersLimit
    });
  }
  
  // Simulate processing uploaded files
  const newSubmissions = files.map((file, index) => ({
    id: mockData.submissions.length + index + 1,
    assignmentId: mockData.assignments.length + 1,
    studentName: `Student ${index + 1}`,
    filename: file.name,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    grade: null,
    score: null,
    totalPoints: 100,
    feedback: null
  }));
  
  mockData.submissions.push(...newSubmissions);
  
  res.json({
    message: 'Papers uploaded successfully',
    submissions: newSubmissions,
    plan,
    papersUsed: mockData.submissions.length,
    papersLimit: subscription.papersLimit
  });
});

// Start grading a submission
app.post('/api/grade-submission/:submissionId', (req, res) => {
  const submissionId = parseInt(req.params.submissionId);
  const submission = mockData.submissions.find(s => s.id === submissionId);
  
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  submission.status = 'in-progress';
  res.json({
    message: 'Grading started',
    submission
  });
});

// Complete grading
app.put('/api/grade-submission/:submissionId', (req, res) => {
  const submissionId = parseInt(req.params.submissionId);
  const { grade, score, feedback } = req.body;
  const submission = mockData.submissions.find(s => s.id === submissionId);
  
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  submission.status = 'graded';
  submission.grade = grade;
  submission.score = score;
  submission.feedback = feedback;
  
  res.json({
    message: 'Grading completed',
    submission
  });
});

// Analytics endpoints
app.get('/api/analytics/overview', (req, res) => {
  const totalStudents = mockData.classes.reduce((sum, c) => sum + c.studentCount, 0);
  const totalAssignments = mockData.assignments.length;
  const totalSubmissions = mockData.submissions.length;
  const gradedSubmissions = mockData.submissions.filter(s => s.status === 'graded').length;
  const averageGrade = mockData.submissions
    .filter(s => s.score !== null)
    .reduce((sum, s) => sum + s.score, 0) / gradedSubmissions || 0;
  
  res.json({
    totalStudents,
    totalAssignments,
    totalSubmissions,
    gradedSubmissions,
    averageGrade: Math.round(averageGrade),
    pendingGrading: totalSubmissions - gradedSubmissions
  });
});

app.get('/api/analytics/class/:classId', (req, res) => {
  const classId = parseInt(req.params.classId);
  const classAssignments = mockData.assignments.filter(a => a.classId === classId);
  const classSubmissions = mockData.submissions.filter(s => 
    classAssignments.some(a => a.id === s.assignmentId)
  );
  
  res.json({
    class: mockData.classes.find(c => c.id === classId),
    assignments: classAssignments,
    submissions: classSubmissions,
    averageGrade: classSubmissions
      .filter(s => s.score !== null)
      .reduce((sum, s) => sum + s.score, 0) / classSubmissions.filter(s => s.score !== null).length || 0
  });
});

// Serve the main dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'teacher-dashboard', 
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/classes',
      'GET /api/assignments',
      'GET /api/submissions',
      'GET /api/grading-queue',
      'POST /api/classes',
      'POST /api/assignments',
      'POST /api/upload-papers',
      'GET /api/analytics/overview',
      'GET /api/subscription/:plan',
      'GET /api/access/student-side/:plan'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Teacher Dashboard Test Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /api/classes`);
  console.log(`  GET  /api/assignments`);
  console.log(`  GET  /api/submissions`);
  console.log(`  GET  /api/grading-queue`);
  console.log(`  POST /api/classes`);
  console.log(`  POST /api/assignments`);
  console.log(`  POST /api/upload-papers`);
  console.log(`  GET  /api/analytics/overview`);
  console.log(`  GET  /api/subscription/:plan`);
  console.log(`  GET  /api/access/student-side/:plan`);
}); 