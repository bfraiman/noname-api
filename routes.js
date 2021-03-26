var express = require('express');
var router = express.Router();

var authController = require('./src/api/controllers/auth');

router.post('/auth/signUp', authController.signUp);
router.post('/auth/signIn', authController.signIn);
router.post('/auth/verify', authController.verify);

module.exports = router;