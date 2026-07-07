const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getObat,
    tambahStokObat,
    kurangiStokObat,
    buangObat,
    tambahObatBaru,
    getCheckupForApoteker,
    getCheckupRekomendasi       // ✅ nama yang benar
} = require('../controllers/apotekerController');

router.use(auth(['apoteker']));

// GET
router.get('/obat', getObat);
router.get('/checkup', getCheckupForApoteker);
router.get('/checkup/rekomendasi', getCheckupRekomendasi);   // ✅ sudah sesuai

// PUT
router.put('/obat/:id/tambah', tambahStokObat);
router.put('/obat/:id/kurang', kurangiStokObat);
router.put('/obat/:id/buang', buangObat);

// POST
router.post('/obat', tambahObatBaru);

module.exports = router;