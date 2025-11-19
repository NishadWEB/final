const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientcontroller');
const chatController = require('../controllers/chatcontroller');

// Middleware to check if user is patient
const requirePatient = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'patient') {
    next();
  } else {
    res.redirect('/auth/login');
  }
};

router.get('/dashboard', requirePatient, patientController.getDashboard);
router.get('/doctors', requirePatient, patientController.getDoctors);
router.get('/appointments', requirePatient, patientController.getAppointments);
router.post('/book-appointment', requirePatient, patientController.bookAppointment);
router.get('/profile', requirePatient, patientController.getProfile);
router.post('/profile', requirePatient, patientController.updateProfile);

// Chat endpoints (simple MVP)
router.get('/chat/messages', requirePatient, chatController.getMessages);
router.post('/chat/message', requirePatient, chatController.postMessage);

module.exports = router;