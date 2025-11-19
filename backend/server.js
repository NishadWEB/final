const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'medidiag-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Routes
app.use('/', require('./routes/launchpageroutes'));
app.use('/auth', require('./routes/authroutes'));
app.use('/patient', require('./routes/patientroutes'));
app.use('/doctor', require('./routes/doctorroutes'));

// expose io to route handlers via app
app.set('io', io);

// API Routes for ML Service
app.post('/api/diagnose', async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    // Call ML service
    const response = await fetch(`${process.env.ML_SERVICE_URL || 'http://localhost:5000'}/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptoms })
    });

    if (!response.ok) {
      throw new Error('ML service unavailable');
    }

    const diagnosis = await response.json();
    res.json(diagnosis);
  } catch (error) {
    console.error('ML Service error:', error);
    // Fallback diagnosis
    // Use a local rule-based fallback so the website still provides useful feedback
    const fallback = localDiagnose(req.body.symptoms || '');
    res.json(fallback);
  }
});

// Simple local rule-based diagnoser used as a fallback when ML service is unreachable
function localDiagnose(text) {
  const t = (text || '').toLowerCase();
  const mapping = [
    { keywords: ['fever', 'temperature'], diagnosis: 'Possible Fever / Infection', severity: 'medium', needs_doctor: true, recommendation: 'Rest, fluids; consult a doctor if fever persists or is high.' },
    { keywords: ['cough', 'sore throat', 'sneezing'], diagnosis: 'Possible Common Cold', severity: 'low', needs_doctor: false, recommendation: 'Rest, fluids, over-the-counter relief.' },
    { keywords: ['headache', 'migraine', 'nausea'], diagnosis: 'Possible Migraine', severity: 'medium', needs_doctor: true, recommendation: 'Rest in a dark room; consult if severe or recurring.' },
    { keywords: ['abdominal pain', 'vomit', 'diarrhea'], diagnosis: 'Possible Gastrointestinal issue', severity: 'medium', needs_doctor: false, recommendation: 'Hydration and bland diet; seek care if severe.' },
    { keywords: ['painful urination', 'urination', 'urinary'], diagnosis: 'Possible UTI', severity: 'high', needs_doctor: true, recommendation: 'See a doctor for testing and antibiotics.' }
  ];

  for (const rule of mapping) {
    if (rule.keywords.some(k => t.includes(k))) {
      return {
        diagnosis: rule.diagnosis,
        recommendation: rule.recommendation,
        severity: rule.severity,
        needs_doctor: rule.needs_doctor,
        confidence: 0.6
      };
    }
  }

  return {
    diagnosis: 'Unable to identify specific symptoms. Please provide more details.',
    recommendation: 'Consult a healthcare professional for proper evaluation.',
    severity: 'unknown',
    needs_doctor: true,
    confidence: 0.0
  };
}

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-appointment', (appointmentId) => {
    socket.join(`appointment-${appointmentId}`);
  });

  // allow clients to join a patient-specific room for chat
  socket.on('join-patient', (patientId) => {
    try {
      socket.join(`patient-${patientId}`);
    } catch (e) {
      console.error('join-patient error', e);
    }
  });

  socket.on('send-message', (data) => {
    io.to(`appointment-${data.appointmentId}`).emit('new-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  res.status(500).render('error', { 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
    user: req.session.user
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    error: 'Page not found',
    user: req.session.user
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 ML Service: ${process.env.ML_SERVICE_URL || 'http://localhost:5000'}`);
  console.log(`💾 Database: ${process.env.DB_NAME || 'medidiag'}`);
});

// ... (other imports and setup) ...

// Session configuration - UPDATED with your secret
app.use(session({
  secret: process.env.SESSION_SECRET || 'TOPSECRET',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// ... (rest of the code remains the same) ...