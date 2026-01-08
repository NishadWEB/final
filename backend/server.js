
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

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