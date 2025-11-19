const path = require('path');

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