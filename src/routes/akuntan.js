const express = require('express');
const auth = require('../middleware/auth');

// import semua fungsi yang diperlukan
const {
    getTagihan,
    getDetailTagihan,
    addTagihan,              // ✅ tambahkan ini
    updateTagihanStatus,
    batalkanLunas,
    getFasilitas,
    toggleFasilitasStatus,
    getPasienCheckInOut
} = require('../controllers/akuntanController');

const router = express.Router();

// middleware auth untuk akuntan
router.use(auth(['akuntan']));

// ROUTES
router.get('/tagihan', getTagihan);
router.get('/tagihan/:id/detail', getDetailTagihan);
router.post('/tagihan', addTagihan);                      // ✅ route untuk tambah tagihan
router.put('/tagihan/:id/status', updateTagihanStatus);
router.put('/tagihan/:id/batalkan-lunas', batalkanLunas);
router.put('/fasilitas/:id/toggle', toggleFasilitasStatus);
router.get('/fasilitas', getFasilitas);
router.get('/pasien/checkinout', getPasienCheckInOut);

module.exports = router;