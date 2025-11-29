const path = require('path');
const { pool } = require('../config/db');

exports.getHome = (req, res) => {
  if (req.session.user) {
    // Redirect to appropriate dashboard if already logged in
    if (req.session.user.role === 'patient') {
      return res.redirect('/patient/dashboard');
    } else if (req.session.user.role === 'doctor') {
      return res.redirect('/doctor/dashboard');
    }
  }
  res.render('launchpage/launchpagehome', { 
    title: 'MediDiag - Online Preliminary Diagnosis',
    user: req.session.user 
  });
};

exports.getAbout = (req, res) => {
  res.render('launchpage/about', { 
    title: 'About MediDiag - Bridging Healthcare Gaps',
    user: req.session.user 
  });
};

exports.getFeatures = (req, res) => {
  res.render('launchpage/features', { 
    title: 'MediDiag Features - Revolutionizing Healthcare',
    user: req.session.user 
  });
};

exports.getFAQs = (req, res) => {
  res.render('launchpage/faqs', { 
    title: 'FAQs - MediDiag',
    user: req.session.user 
  });
};

exports.getContact = (req, res) => {
  res.render('launchpage/contact', { 
    title: 'Contact Us - MediDiag',
    user: req.session.user 
  });
};

// Handle contact form submissions
exports.postContact = async (req, res) => {
  try {
    const { full_name, email, subject, message } = req.body;

    if (!full_name || !email || !subject || !message) {
      return res.status(400).render('launchpage/contact', {
        title: 'Contact Us - MediDiag',
        user: req.session.user,
        error: 'Please fill in all required fields.'
      });
    }

    // Save the contact message into notifications (user_id may be null for public contact)
    const insertText = `INSERT INTO notifications (user_id, title, message, type, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`;
    await pool.query(insertText, [null, subject, `From: ${full_name} <${email}>\n\n${message}`, 'contact']);

    // Render the contact page with a success message
    return res.render('launchpage/contact', {
      title: 'Contact Us - MediDiag',
      user: req.session.user,
      success: 'Thanks — your message has been received. We will get back to you within 24 hours.'
    });
  } catch (err) {
    console.error('Error handling contact form:', err);
    return res.status(500).render('error', {
      error: process.env.NODE_ENV === 'development' ? err.message : 'Unable to send message at this time.',
      user: req.session.user
    });
  }
};

// Prelogin pages
exports.getPreloginHome = (req, res) => {
  res.render('preloginpage/preloginhome', {
    title: 'MediDiag - Choose Your Portal',
    user: req.session.user
  });
};

exports.getPreloginAbout = (req, res) => {
  res.render('preloginpage/preloginabout', {
    title: 'About - MediDiag',
    user: req.session.user
  });
};

exports.getPreloginFeatures = (req, res) => {
  res.render('preloginpage/preloginfeatures', {
    title: 'Features - MediDiag',
    user: req.session.user
  });
};

exports.getPreloginFAQs = (req, res) => {
  res.render('preloginpage/preloginfaqs', {
    title: 'FAQs - MediDiag',
    user: req.session.user
  });
};

exports.getPreloginContact = (req, res) => {
  res.render('preloginpage/prelogincontact', {
    title: 'Contact - MediDiag',
    user: req.session.user
  });
};