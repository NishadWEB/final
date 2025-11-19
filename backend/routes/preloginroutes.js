const express = require('express');
const router = express.Router();
const roleController = require('../controllers/rolecontroller');

router.get('/role-selection', roleController.getRoleSelection);
router.post('/select-role', roleController.handleRoleSelection);

module.exports = router;