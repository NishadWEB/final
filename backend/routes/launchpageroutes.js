const express = require('express');
const router = express.Router();
const launchPageController = require('../controllers/launchpagecontroller');

// Public routes (launch pages)
router.get('/', launchPageController.getHome);
router.get('/about', launchPageController.getAbout);
router.get('/features', launchPageController.getFeatures);
router.get('/faqs', launchPageController.getFAQs);
router.get('/contact', launchPageController.getContact);
router.post('/contact', launchPageController.postContact);

// Prelogin routes
router.get('/prelogin', launchPageController.getPreloginHome);
router.get('/prelogin/about', launchPageController.getPreloginAbout);
router.get('/prelogin/features', launchPageController.getPreloginFeatures);
router.get('/prelogin/faqs', launchPageController.getPreloginFAQs);
router.get('/prelogin/contact', launchPageController.getPreloginContact);

module.exports = router;