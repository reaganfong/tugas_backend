const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getDashboardDokter,
    getPasienSaya,
    updateDeskripsiPasien,
    getJadwalSaya,
    updateCheckupStatus,
    dischargePasien,
    batalkanPulangPasien,      // ✅ pastikan ada
    assignRawatInap,
    pulangkanDariRuangan
} = require('../controllers/dokterController');

router.use(auth(['dokter']));

router.get('/dashboard', getDashboardDokter);
router.get('/pasien-saya', getPasienSaya);
router.get('/jadwal', getJadwalSaya);
router.put('/pasien/:id/deskripsi', updateDeskripsiPasien);
router.put('/checkup/:id/selesai', updateCheckupStatus);
router.put('/pasien/:id/discharge', dischargePasien);
router.put('/pasien/:id/batalkan-pulang', batalkanPulangPasien);   // ✅ baris ini yang perlu dicek
router.post('/rawat-inap/assign', assignRawatInap);
router.put('/ruangan/:id/pulangkan', pulangkanDariRuangan);

module.exports = router;