const express = require('express');
const auth = require('../middleware/auth');
const {
    getPasien, 
    getBayi, 
    getDokter, 
    addPasien,
    getStaff, 
    addStaff, 
    updateStaff, 
    addBayi, 
    updatePasien,
    getRuanganStatus, 
    getNotifikasiDarurat, 
    getPasienCheckInOut, 
    getPasienWithFilter,
    getBayiWithFilter,      
    getCheckupWithFilter,   
    getDokterWithFilter,    
    getRuanganWithFilter,   
    getStaffWithFilter, 
    getCheckup, 
    addCheckup, 
    updateCheckup,
    getShiftJadwal, 
    addShift, 
    markNotifikasiDibaca, 
    updateBayi, 
    updateDokter, 
    updateShiftStaff, 
    updateShiftUser, 
    getUsers,
    updateRuanganStatus,
    updateRuangan, 
    deletePasien,
    batalCheckup,
    getJadwalCheckup,
    getSudahCheckout,
    deleteBayi,          // ✅ ditambahkan
    deleteDokter,        // ✅ ditambahkan
    deleteRuangan,       // ✅ ditambahkan
    deleteStaff          // ✅ ditambahkan
} = require('../controllers/adminController');

const router = express.Router();

// Auth — semua route admin butuh login + jabatan admin
router.use(auth(['admin']));

// ==================== GET ====================
router.get('/pasien', getPasien);
router.get('/bayi', getBayi);
router.get('/dokter', getDokter);
router.get('/staff', getStaff);
router.get('/users', getUsers);

// === ROUTE DENGAN PARAMETER HARUS DI BAWAH ROUTE YANG SPESIFIK ===
router.get('/ruangan/filter', getRuanganWithFilter);
router.get('/ruangan', getRuanganStatus);
router.get('/ruangan/:nama', getRuanganStatus);

router.get('/notifikasi', getNotifikasiDarurat);
router.get('/pasien/checkinout', getPasienCheckInOut);
router.get('/pasien/filter', getPasienWithFilter);
router.get('/bayi/filter', getBayiWithFilter);
router.get('/checkup/filter', getCheckupWithFilter);
router.get('/dokter/filter', getDokterWithFilter);
router.get('/staff/filter', getStaffWithFilter);
router.get('/checkup', getCheckup);
router.get('/shift', getShiftJadwal);
router.get('/checkup/jadwal', getJadwalCheckup);
router.get('/checkup/sudah-checkout', getSudahCheckout);

// ==================== POST (TAMBAH DATA) ====================
router.post('/pasien', addPasien);
router.post('/bayi', addBayi);
router.post('/staff', addStaff);
router.post('/checkup', addCheckup);
router.post('/shift', addShift);

// ==================== PUT (UPDATE DATA) ====================
router.put('/pasien/:id', updatePasien);
router.put('/dokter/:id', updateDokter);
router.put('/staff/:id', updateStaff);
router.put('/checkup/:id', updateCheckup);
router.put('/bayi/:id', updateBayi);
router.put('/ruangan/:id/status', updateRuanganStatus);
router.put('/ruangan/:id', updateRuangan);
router.put('/notifikasi/:id/read', markNotifikasiDibaca);
router.put('/shift/staff', updateShiftStaff);
router.put('/shift/user', updateShiftUser);
router.put('/checkup/:id/batal', batalCheckup);

// ==================== DELETE ====================
router.delete('/pasien/:id', deletePasien);
router.delete('/bayi/:id', deleteBayi);
router.delete('/dokter/:id', deleteDokter);
router.delete('/ruangan/:id', deleteRuangan);
router.delete('/staff/:id', deleteStaff);

module.exports = router;