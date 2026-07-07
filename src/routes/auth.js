const express = require('express');
const router = express.Router();

const authController = require('../controllers/authControllers');
const auth = require('../middleware/auth');

router.post('/register', auth(null), authController.register);
router.post('/login', auth(null), authController.login);
router.post('/logout', auth(null), authController.logout);
router.get('/check', auth([]), authController.checkSession);
router.get('/me', auth([]), authController.getMe);

module.exports = router;
