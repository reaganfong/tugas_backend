const express = require('express');
const auth = require('../middleware/auth');
const {
    getProfilById,
    searchPasien
} = require('../controllers/pasienController');

const router = express.Router();

// Auth — butuh login (role apa pun)
router.use(auth([]));

// Route untuk pencarian
router.get('/search', searchPasien);
router.get('/:id', getProfilById);

module.exports = router;
