const express = require('express');
const auth = require('../middleware/auth');
const {
    getProfilById,
    searchPasien
} = require('../controllers/pasienController');

const router = express.Router();

// Route untuk pencarian
router.get('/search', auth([]), searchPasien);
router.get('/:id', auth([]), getProfilById);

module.exports = router;
