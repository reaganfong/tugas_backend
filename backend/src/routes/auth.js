const express = require('express');
const router = express.Router();

const authController = require('../controllers/authControllers');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/check', authController.checkSession); 

module.exports = router;