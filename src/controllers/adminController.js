const prisma = require('../config/prisma');
const { toInt, toFloat } = require('../utils/sanitize');
const { handleError } = require('../utils/handleError');

// ==================== GET PASIEN CHECK IN OUT ====================
const getPasienCheckInOut = async (req, res) => {
    try {
        const rows = await prisma.checkUp.findMany({
            include: {
                pasien: { select: { nama: true } },
                dokter: { select: { nama_dokter: true } }
            },
            orderBy: [
                { tanggal: 'desc' },
                { jam: 'desc' }
            ]
        });

        const result = rows.map(c => ({
            id_checkup: c.id,
            nama_pasien: c.pasien?.nama || '-',
            nama_dokter: c.dokter?.nama_dokter || '-',
            tanggal: c.tanggal,
            jam: c.jam,
            checkout: c.checkout,
            keterangan: c.keterangan,
            biaya_checkup: c.biaya_checkup
        }));

        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET PASIEN ====================
const getPasien = async (req, res) => {
    try {
        const rows = await prisma.pasien.findMany();
        const result = rows.map(p => ({ id_pasien: p.id, ...p }));
        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

// ===== GET PASIEN DENGAN SEARCH + PAGINATION =====
const getPasienWithFilter = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        const andConditions = [];

        if (search && search.trim() !== '') {
            andConditions.push({
                OR: [
                    { nama: { contains: search.trim(), mode: 'insensitive' } },
                    { nama_wali: { contains: search.trim(), mode: 'insensitive' } }
                ]
            });
        }

        if (status === 'dirawat') {
            andConditions.push({ msh_dirawat: 'dirawat' });
        } else if (status === 'pulang') {
            andConditions.push({ msh_dirawat: 'pulang' });
        } else if (status === 'baru') {
            andConditions.push({ msh_dirawat: 'baru' });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const [total, rows] = await Promise.all([
            prisma.pasien.count({ where }),
            prisma.pasien.findMany({
                where,
                orderBy: { id: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            })
        ]);

        const formattedData = rows.map(row => ({
            id_pasien: row.id,
            ...row,
            status_display: row.msh_dirawat === 'baru' ? 'Baru' :
                           row.msh_dirawat === 'dirawat' ? 'Dirawat' : 'Pulang',
            is_dirawat: row.msh_dirawat === 'dirawat'
        }));

        res.json({
            data: formattedData,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        console.error('[ERROR] getPasienWithFilter:', err);
        handleError(res, err);
    }
};

// ==================== GET BAYI ====================
const getBayi = async (req, res) => {
    try {
        const rows = await prisma.bayi.findMany();
        const result = rows.map(b => ({ id_bayi: b.id, ...b }));
        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET BAYI DENGAN FILTER + PAGINATION ====================
const getBayiWithFilter = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        if (search && search.trim() !== '') {
            where.OR = [
                { nama_bayi: { contains: search.trim(), mode: 'insensitive' } },
                { nama_ibu: { contains: search.trim(), mode: 'insensitive' } }
            ];
        }

        const [total, rows] = await Promise.all([
            prisma.bayi.count({ where }),
            prisma.bayi.findMany({
                where,
                orderBy: { id: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            })
        ]);

        // Penting: mapping id_bayi untuk frontend (tombol edit/hapus)
        const data = rows.map(b => ({ id_bayi: b.id, ...b }));

        res.json({
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET DOKTER ====================
const getDokter = async (req, res) => {
    try {
        const rows = await prisma.dokter.findMany({
            include: { user: { select: { username: true } } }
        });
        const result = rows.map(d => ({
            id_dokter: d.id,
            nama_dokter: d.nama_dokter,
            spesialisasi: d.spesialisasi,
            umur: d.umur,
            no_telepon: d.no_telepon,
            biaya_honor: d.biaya_honor,
            username: d.user?.username
        }));
        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET DOKTER DENGAN FILTER + PAGINATION ====================
const getDokterWithFilter = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        if (search && search.trim() !== '') {
            where.OR = [
                { nama_dokter: { contains: search.trim(), mode: 'insensitive' } },
                { spesialisasi: { contains: search.trim(), mode: 'insensitive' } }
            ];
        }

        const [total, rows] = await Promise.all([
            prisma.dokter.count({ where }),
            prisma.dokter.findMany({
                where,
                orderBy: { id: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            })
        ]);

        const result = rows.map(d => ({
            id_dokter: d.id,
            ...d
        }));

        res.json({
            data: result,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET STAFF ====================
const getStaff = async (req, res) => {
    try {
        const rows = await prisma.staff.findMany();
        const result = rows.map(s => ({ id_staff: s.id, ...s }));
        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET STAFF DENGAN FILTER + PAGINATION ====================
const getStaffWithFilter = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        if (search && search.trim() !== '') {
            where.OR = [
                { nama_staff: { contains: search.trim(), mode: 'insensitive' } },
                { jabatan: { contains: search.trim(), mode: 'insensitive' } }
            ];
        }

        const [total, rows] = await Promise.all([
            prisma.staff.count({ where }),
            prisma.staff.findMany({
                where,
                orderBy: { id: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            })
        ]);

        const result = rows.map(s => ({ id_staff: s.id, ...s }));

        res.json({
            data: result,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET USERS ====================
const getUsers = async (req, res) => {
    try {
        const rows = await prisma.user.findMany({
            select: { id: true, username: true, jabatan: true }
        });
        res.json(rows);
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== ADD STAFF ====================
const addStaff = async (req, res) => {
    try {
        const { jabatan, nama_staff, no_telepon, gaji, hari, shift } = req.body;

        if (!nama_staff) {
            return res.status(400).json({ message: 'Nama wajib diisi' });
        }

        const gajiVal = toInt(gaji, 'Gaji');
        if (gajiVal.error) return res.status(400).json({ message: gajiVal.error });
        if (gajiVal.value === null) return res.status(400).json({ message: 'Gaji wajib diisi' });

        const result = await prisma.staff.create({
            data: {
                jabatan: jabatan || null,
                nama_staff: nama_staff,
                no_telepon: no_telepon || null,
                gaji: gajiVal.value
            }
        });

        const staffId = result.id;

        if (hari && shift) {
            const days = Array.isArray(hari) ? hari : String(hari).split(',').map(s => s.trim()).filter(Boolean);
            const allowedDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
            const allowedShifts = ['Shift I', 'Shift II', 'Shift III'];

            for (const h of days) {
                if (!allowedDays.includes(h)) continue;
                if (!allowedShifts.includes(shift)) continue;
                await prisma.shiftStaff.create({
                    data: { id_staff: staffId, hari: h, shift: shift }
                });
            }
        }

        res.json({ message: 'Staff berhasil ditambahkan', id: staffId });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET RUANGAN STATUS ====================
const getRuanganStatus = async (req, res) => {
    try {
        const { nama } = req.params;

        const where = {};
        if (nama) {
            where.nama_ruangan = nama;
        }

        const rows = await prisma.ruangan.findMany({
            where,
            include: {
                pasien: { select: { nama: true } }
            }
        });

        const now = new Date();
        const formatted = rows.map(r => {
            // Fix: treat as terisi jika ada pasien ditempati, regardless of status field
            const safeStatus = r.ditempati ? 'terisi' : (r.status || 'kosong');

            let lamaInapHari = null;
            if (r.tanggal_checkin && safeStatus === 'terisi') {
                const checkin = new Date(r.tanggal_checkin);
                lamaInapHari = Math.max(1, Math.ceil((now - checkin) / (1000 * 60 * 60 * 24)));
            }

            return {
                id_ruangan: r.id,
                nama_ruangan: r.nama_ruangan,
                nomor_ruangan: r.nomor_ruangan,
                ditempati: r.ditempati,
                status: safeStatus,
                biaya_per_hari: r.biaya_per_hari,
                id_tagihan: r.id_tagihan,
                tanggal_checkin: r.tanggal_checkin,
                nama_pasien: r.pasien?.nama || null,
                lama_inap_hari: lamaInapHari,
                lama_inap: safeStatus === 'terisi' && r.tanggal_checkin ? (lamaInapHari || r.lama_inap || '?') : null
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error('[ERROR] getRuanganStatus:', err);
        handleError(res, err);
    }
};

// ==================== GET RUANGAN DENGAN FILTER + PAGINATION ====================
const getRuanganWithFilter = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        const andConditions = [];

        if (search && search.trim() !== '') {
            andConditions.push({
                OR: [
                    { nama_ruangan: { contains: search.trim(), mode: 'insensitive' } },
                    { pasien: { nama: { contains: search.trim(), mode: 'insensitive' } } }
                ]
            });
        }

        if (status && status.trim() !== '') {
            andConditions.push({ status: status });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const [total, rows] = await Promise.all([
            prisma.ruangan.count({ where }),
            prisma.ruangan.findMany({
                where,
                include: {
                    pasien: { select: { nama: true } }
                },
                orderBy: { id: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            })
        ]);

        const now = new Date();
        const formatted = rows.map(r => {
            // Fix: treat as terisi jika ada pasien ditempati, regardless of status field
            const safeStatus = r.ditempati ? 'terisi' : (r.status || 'kosong');

            let lamaInapHari = null;
            if (r.tanggal_checkin && safeStatus === 'terisi') {
                const checkin = new Date(r.tanggal_checkin);
                lamaInapHari = Math.max(1, Math.ceil((now - checkin) / (1000 * 60 * 60 * 24)));
            }

            return {
                id_ruangan: r.id,
                nama_ruangan: r.nama_ruangan,
                nomor_ruangan: r.nomor_ruangan,
                ditempati: r.ditempati,
                status: safeStatus,
                biaya_per_hari: r.biaya_per_hari,
                id_tagihan: r.id_tagihan,
                tanggal_checkin: r.tanggal_checkin,
                nama_pasien: r.pasien?.nama || null,
                lama_inap_hari: lamaInapHari,
                lama_inap: safeStatus === 'terisi' && r.tanggal_checkin ? (lamaInapHari || r.lama_inap || '?') : null
            };
        });

        res.json({
            data: formatted,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        console.error('[ERROR] getRuanganWithFilter:', err);
        handleError(res, err);
    }
};

// ==================== NOTIFIKASI ====================
const getNotifikasiDarurat = async (req, res) => {
    try {
        const rows = await prisma.notifikasi.findMany({
            where: { dibaca: false },
            orderBy: { tanggal: 'desc' }
        });
        const result = rows.map(n => ({ id_notif: n.id, ...n }));
        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

const markNotifikasiDibaca = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await prisma.notifikasi.update({
            where: { id },
            data: { dibaca: true }
        });
        res.json({ message: 'Notifikasi ditandai sudah dibaca' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
        }
        handleError(res, err);
    }
};

// ==================== GET CHECKUP ====================
const getCheckup = async (req, res) => {
    try {
        const rows = await prisma.checkUp.findMany({
            include: {
                pasien: { select: { nama: true } },
                dokter: { select: { nama_dokter: true } }
            },
            orderBy: [
                { tanggal: 'desc' },
                { jam: 'desc' }
            ]
        });

        const result = rows.map(c => ({
            id_checkup: c.id,
            id_pasien: c.id_pasien,
            id_dokter: c.id_dokter,
            nama_pasien: c.pasien?.nama || '-',
            nama_dokter: c.dokter?.nama_dokter || '-',
            jam: c.jam,
            tanggal: c.tanggal,
            checkout: c.checkout,
            keterangan: c.keterangan,
            status: c.status,
            biaya_checkup: c.biaya_checkup
        }));

        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET CHECKUP DENGAN FILTER + PAGINATION ====================
const getCheckupWithFilter = async (req, res) => {
    try {
        const { search, searchType, status, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        const andConditions = [];

        if (search && search.trim() !== '') {
            if (searchType === 'pasien') {
                andConditions.push({
                    pasien: { nama: { contains: search.trim(), mode: 'insensitive' } }
                });
            } else if (searchType === 'dokter') {
                andConditions.push({
                    dokter: { nama_dokter: { contains: search.trim(), mode: 'insensitive' } }
                });
            } else {
                andConditions.push({
                    OR: [
                        { pasien: { nama: { contains: search.trim(), mode: 'insensitive' } } },
                        { dokter: { nama_dokter: { contains: search.trim(), mode: 'insensitive' } } }
                    ]
                });
            }
        }

        if (status && status.trim() !== '') {
            andConditions.push({ status });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const [total, rows] = await Promise.all([
            prisma.checkUp.count({ where }),
            prisma.checkUp.findMany({
                where,
                include: {
                    pasien: { select: { nama: true } },
                    dokter: { select: { nama_dokter: true } }
                },
                orderBy: [
                    { tanggal: 'desc' },
                    { jam: 'desc' }
                ],
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            })
        ]);

        const result = rows.map(c => ({
            id_checkup: c.id,
            id_pasien: c.id_pasien,
            id_dokter: c.id_dokter,
            nama_pasien: c.pasien?.nama || '-',
            nama_dokter: c.dokter?.nama_dokter || '-',
            jam: c.jam,
            tanggal: c.tanggal,
            checkout: c.checkout,
            keterangan: c.keterangan,
            status: c.status,
            biaya_checkup: c.biaya_checkup
        }));

        res.json({
            data: result,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET JADWAL CHECKUP (BELUM CHECKOUT) ====================
const getJadwalCheckup = async (req, res) => {
    try {
        const rows = await prisma.checkUp.findMany({
            where: { status: 'terjadwal' },
            include: {
                pasien: { select: { nama: true } },
                dokter: { select: { nama_dokter: true } }
            },
            orderBy: [
                { tanggal: 'desc' },
                { jam: 'desc' }
            ]
        });

        const result = rows.map(c => ({
            id_checkup: c.id,
            id_pasien: c.id_pasien,
            id_dokter: c.id_dokter,
            nama_pasien: c.pasien?.nama || '-',
            nama_dokter: c.dokter?.nama_dokter || '-',
            jam: c.jam,
            tanggal: c.tanggal,
            keterangan: c.keterangan,
            biaya_checkup: c.biaya_checkup,
            status: c.status
        }));

        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET SUDAH CHECKOUT (SELESAI + BATAL) ====================
const getSudahCheckout = async (req, res) => {
    try {
        const rows = await prisma.checkUp.findMany({
            where: {
                status: { in: ['selesai', 'batal'] }
            },
            include: {
                pasien: { select: { nama: true } },
                dokter: { select: { nama_dokter: true } }
            },
            orderBy: [
                { tanggal: 'desc' },
                { jam: 'desc' }
            ]
        });

        const result = rows.map(c => ({
            id_checkup: c.id,
            id_pasien: c.id_pasien,
            id_dokter: c.id_dokter,
            nama_pasien: c.pasien?.nama || '-',
            nama_dokter: c.dokter?.nama_dokter || '-',
            jam: c.jam,
            tanggal: c.tanggal,
            checkout: c.checkout,
            keterangan: c.keterangan,
            status: c.status,
            biaya_checkup: c.biaya_checkup
        }));

        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== ADD CHECKUP ====================
const addCheckup = async (req, res) => {
    try {
        const { id_pasien, id_dokter, jam, tanggal, biaya_checkup, keterangan } = req.body;

        if (!id_pasien || !id_dokter || !tanggal || !jam) {
            return res.status(400).json({ message: 'Data checkup tidak lengkap' });
        }

        const pasien = await prisma.pasien.findUnique({ where: { id: id_pasien } });
        if (!pasien) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }

        const ruanganTerisi = await prisma.ruangan.count({
            where: { ditempati: id_pasien, status: 'terisi' }
        });

        if (ruanganTerisi > 0) {
            return res.status(400).json({
                message: 'Pasien sedang rawat inap! Tidak bisa checkup. Pulangkan pasien dari ruangan terlebih dahulu.'
            });
        }

        const dokter = await prisma.dokter.findUnique({ where: { id: id_dokter } });
        if (!dokter) {
            return res.status(404).json({ message: 'Dokter tidak ditemukan' });
        }

        const biaya = parseFloat(biaya_checkup) || 0;

        await prisma.checkUp.create({
            data: {
                id_pasien,
                id_dokter,
                jam,
                tanggal,
                biaya_checkup: biaya,
                keterangan: keterangan || null,
                status: 'terjadwal'
            }
        });

        res.json({ message: 'Checkup berhasil ditambahkan' });
    } catch (err) {
        console.error('[BACKEND] Error addCheckup:', err);
        handleError(res, err);
    }
};

// ==================== UPDATE DOKTER ====================
const updateDokter = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            nama_dokter,
            spesialisasi,
            umur,
            no_telepon,
            biaya_honor,
            hari,
            shift
        } = req.body;

        if (!nama_dokter) {
            return res.status(400).json({ message: 'Nama dokter wajib diisi' });
        }

        const existing = await prisma.dokter.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Dokter tidak ditemukan' });
        }

        // Sanitasi numerik
        const umurVal = toInt(umur, 'Umur');
        if (umurVal.error) return res.status(400).json({ message: umurVal.error });
        const biayaHonorVal = toInt(biaya_honor, 'Biaya honor');
        if (biayaHonorVal.error) return res.status(400).json({ message: biayaHonorVal.error });

        await prisma.dokter.update({
            where: { id },
            data: {
                nama_dokter,
                spesialisasi: spesialisasi || null,
                no_telepon: no_telepon || null,
                umur: umurVal.value,
                biaya_honor: biayaHonorVal.value
            }
        });

        // Clear existing shift_users for this doctor's userId
        const dokterUser = await prisma.dokter.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (dokterUser?.userId) {
            await prisma.shiftUser.deleteMany({
                where: { id_users: dokterUser.userId }
            });

            if (hari && shift) {
                const days = Array.isArray(hari) ? hari : String(hari).split(',').map(s => s.trim()).filter(Boolean);
                const allowedDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                const allowedShifts = ['Shift I', 'Shift II', 'Shift III'];
                for (const h of days) {
                    if (allowedDays.includes(h) && allowedShifts.includes(shift)) {
                        await prisma.shiftUser.create({
                            data: { id_users: dokterUser.userId, hari: h, shift }
                        });
                    }
                }
            }
        }

        res.json({ message: 'Data dokter berhasil diubah' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== UPDATE STAFF ====================
const updateStaff = async (req, res) => {
    try {
        const id = req.params.id;
        const { nama_staff, jabatan, no_telepon, gaji, hari, shift } = req.body;
        if (!nama_staff) return res.status(400).json({ message: 'Nama staff wajib diisi' });
        const gajiVal = toInt(gaji, 'Gaji');
        if (gajiVal.error) return res.status(400).json({ message: gajiVal.error });
        if (gajiVal.value === null) return res.status(400).json({ message: 'Gaji wajib diisi' });

        const existing = await prisma.staff.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: 'Staff tidak ditemukan' });

        await prisma.staff.update({
            where: { id },
            data: {
                nama_staff,
                jabatan: jabatan || null,
                no_telepon: no_telepon || null,
                gaji: gajiVal.value
            }
        });

        await prisma.shiftStaff.deleteMany({ where: { id_staff: id } });

        if (hari && shift) {
            const days = Array.isArray(hari) ? hari : String(hari).split(',').map(s => s.trim()).filter(Boolean);
            const allowedDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
            const allowedShifts = ['Shift I', 'Shift II', 'Shift III'];
            for (const h of days) {
                if (allowedDays.includes(h) && allowedShifts.includes(shift)) {
                    await prisma.shiftStaff.create({
                        data: { id_staff: id, hari: h, shift }
                    });
                }
            }
        }

        res.json({ message: 'Data staff berhasil diubah' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== UPDATE PASIEN ====================
const updatePasien = async (req, res) => {
    try {
        console.log('[ADMIN] updatePasien called, id=', req.params.id);
        const id = req.params.id;
        const {
            nama,
            nama_wali,
            jenis_penyakit,
            nama_penyakit,
            umur,
            jenis_kelamin,
            no_telp_pasien,
            no_telp_wali,
            deskripsi_dokter
        } = req.body;

        if (!nama) {
            return res.status(400).json({ message: 'Nama pasien wajib diisi' });
        }

        const existing = await prisma.pasien.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }

        // Sanitasi numerik
        const umurVal = toInt(umur, 'Umur');
        if (umurVal.error) return res.status(400).json({ message: umurVal.error });

        await prisma.pasien.update({
            where: { id },
            data: {
                nama,
                nama_wali: nama_wali || null,
                jenis_penyakit: jenis_penyakit || null,
                nama_penyakit: nama_penyakit || null,
                umur: umurVal.value,
                jenis_kelamin: jenis_kelamin || null,
                no_telp_pasien: no_telp_pasien || null,
                no_telp_wali: no_telp_wali || null,
                deskripsi_dokter: deskripsi_dokter || null
            }
        });

        res.json({ message: 'Data pasien berhasil diubah' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== UPDATE CHECKUP ====================
const updateCheckup = async (req, res) => {
    try {
        const id = req.params.id;
        const { id_pasien, id_dokter, jam, tanggal, checkout, status, keterangan, biaya_checkup } = req.body;

        if (!id_pasien || !id_dokter || !tanggal || !jam) {
            return res.status(400).json({ message: 'ID pasien, ID dokter, tanggal dan jam checkin wajib diisi' });
        }

        const existing = await prisma.checkUp.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Checkup tidak ditemukan' });
        }

        // Sanitasi numerik
        const biayaCheckupVal = toFloat(biaya_checkup, 'Biaya checkup');
        if (biayaCheckupVal.error) return res.status(400).json({ message: biayaCheckupVal.error });

        await prisma.checkUp.update({
            where: { id },
            data: {
                id_pasien,
                id_dokter,
                jam,
                tanggal,
                checkout: checkout || null,
                status: status || null,
                keterangan: keterangan || null,
                biaya_checkup: biayaCheckupVal.value ?? 0
            }
        });

        res.json({ message: 'Data checkup berhasil diubah' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== ADD PASIEN ====================
const addPasien = async (req, res) => {
    try {
        const {
            nama,
            nama_wali,
            umur,
            jenis_kelamin,
            no_telp_pasien,
            no_telp_wali
        } = req.body;

        if (!nama) {
            return res.status(400).json({ message: 'Nama pasien wajib diisi' });
        }

        // Cek duplicate
        const existing = await prisma.pasien.findFirst({
            where: {
                nama: nama,
                no_telp_pasien: no_telp_pasien
            }
        });

        if (existing) {
            return res.status(400).json({
                message: 'Pasien dengan nama dan no telepon ini sudah terdaftar! ID: ' + existing.id
            });
        }

        // Sanitasi numerik
        const umurVal = toInt(umur, 'Umur');
        if (umurVal.error) return res.status(400).json({ message: umurVal.error });

        const result = await prisma.pasien.create({
            data: {
                nama,
                nama_wali: nama_wali || null,
                umur: umurVal.value,
                jenis_kelamin: jenis_kelamin || null,
                no_telp_pasien: no_telp_pasien || null,
                no_telp_wali: no_telp_wali || null,
                msh_dirawat: 'baru'
            }
        });

        res.json({ message: 'Pasien berhasil ditambahkan', id: result.id });
    } catch (err) {
        console.error('[ERROR] addPasien:', err);
        handleError(res, err);
    }
};

// ==================== ADD BAYI ====================
const addBayi = async (req, res) => {
    try {
        const {
            nama_ibu,
            nama_bayi,
            jenis_kelamin,
            berat,
            tinggi
        } = req.body;

        console.log('[DEBUG] addBayi - data diterima:', req.body);

        if (!nama_ibu) {
            return res.status(400).json({ message: 'Nama Ibu wajib diisi' });
        }

        // Generate id_ibu manual: max id_ibu + 1
        const maxIbu = await prisma.bayi.aggregate({
            _max: { id_ibu: true }
        });
        const newIdIbu = (maxIbu._max.id_ibu || 0) + 1;

        // Sanitasi numerik
        const beratVal = toFloat(berat, 'Berat');
        if (beratVal.error && berat !== undefined) return res.status(400).json({ message: beratVal.error });
        const tinggiVal = toFloat(tinggi, 'Tinggi');
        if (tinggiVal.error && tinggi !== undefined) return res.status(400).json({ message: tinggiVal.error });

        const result = await prisma.bayi.create({
            data: {
                id_ibu: newIdIbu,
                nama_ibu,
                nama_bayi: nama_bayi || null,
                jenis_kelamin: jenis_kelamin || null,
                berat: beratVal.value,
                tinggi: tinggiVal.value
            }
        });

        res.json({
            message: 'Bayi berhasil ditambahkan',
            id: result.id,
            id_ibu: newIdIbu
        });
    } catch (err) {
        console.error('[ERROR] addBayi:', err);
        handleError(res, err);
    }
};

// ==================== UPDATE BAYI ====================
const updateBayi = async (req, res) => {
    try {
        const id = req.params.id;
        const { id_ibu, nama_ibu, nama_bayi, jenis_kelamin, berat, tinggi } = req.body;

        // Sanitasi numerik
        const beratVal = toFloat(berat, 'Berat');
        if (beratVal.error && berat !== undefined) return res.status(400).json({ message: beratVal.error });
        const tinggiVal = toFloat(tinggi, 'Tinggi');
        if (tinggiVal.error && tinggi !== undefined) return res.status(400).json({ message: tinggiVal.error });

        const existing = await prisma.bayi.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Bayi tidak ditemukan' });
        }

        await prisma.bayi.update({
            where: { id },
            data: {
                id_ibu: id_ibu || null,
                nama_ibu: nama_ibu || null,
                nama_bayi: nama_bayi || null,
                jenis_kelamin: jenis_kelamin || null,
                berat: beratVal.value,
                tinggi: tinggiVal.value
            }
        });

        res.json({ message: 'Data bayi berhasil diubah' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Bayi tidak ditemukan' });
        }
        handleError(res, err);
    }
};

// ==================== ADD SHIFT ====================
const addShift = async (req, res) => {
    try {
        const { tipe, id, hari, shift } = req.body;

        console.log('[ADD SHIFT] Data diterima:', { tipe, id, hari, shift });

        if (!tipe || !id || !hari || !shift) {
            return res.status(400).json({ message: 'Data tidak lengkap' });
        }

        if (tipe !== 'staff' && tipe !== 'user') {
            return res.status(400).json({ message: 'Tipe harus "staff" atau "user"' });
        }

        const days = Array.isArray(hari) ? hari : [hari];
        let insertedCount = 0;

        if (tipe === 'staff') {
            await prisma.shiftStaff.deleteMany({ where: { id_staff: id } });
            for (const day of days) {
                await prisma.shiftStaff.create({
                    data: { id_staff: id, hari: day, shift }
                });
                insertedCount++;
            }
        } else {
            await prisma.shiftUser.deleteMany({ where: { id_users: id } });
            for (const day of days) {
                await prisma.shiftUser.create({
                    data: { id_users: id, hari: day, shift }
                });
                insertedCount++;
            }
        }

        console.log(`[ADD SHIFT] Berhasil insert ${insertedCount} hari untuk ${tipe} ID ${id}`);

        res.json({
            message: `Shift berhasil ditambahkan! (${insertedCount} hari)`,
            inserted: insertedCount,
            total: days.length
        });
    } catch (err) {
        console.error('[ERROR] addShift:', err);
        handleError(res, err);
    }
};

// ==================== GET SHIFT JADWAL ====================
const getShiftJadwal = async (req, res) => {
    try {
        const { hari, shift } = req.query;

        const shiftWhere = {};
        if (hari) shiftWhere.hari = hari;
        if (shift) shiftWhere.shift = shift;

        const [staffRows, userRows] = await Promise.all([
            prisma.shiftStaff.findMany({
                where: shiftWhere,
                include: {
                    staff: { select: { id: true, nama_staff: true } }
                }
            }),
            prisma.shiftUser.findMany({
                where: shiftWhere,
                include: {
                    user: { select: { id: true, username: true } }
                }
            })
        ]);

        const staffMapped = staffRows.map(s => ({
            id_staff: s.staff?.id,
            nama_staff: s.staff?.nama_staff || '-',
            hari: s.hari,
            shift: s.shift,
            tipe: 'staff'
        }));

        const userMapped = userRows.map(u => ({
            id: u.user?.id,
            username: u.user?.username || '-',
            hari: u.hari,
            shift: u.shift,
            tipe: 'user'
        }));

        res.json({ staff: staffMapped, users: userMapped });
    } catch (err) {
        console.error('[ERROR] getShiftJadwal:', err);
        handleError(res, err);
    }
};

// ==================== UPDATE RUANGAN STATUS ====================
const updateRuanganStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, id_pasien, lama_inap, biaya_per_hari } = req.body;

        console.log('[BACKEND] updateRuanganStatus:', { id, status, id_pasien, lama_inap, biaya_per_hari });

        if (!status) {
            return res.status(400).json({ message: 'Status wajib diisi' });
        }

        const ruangan = await prisma.ruangan.findUnique({ where: { id } });
        if (!ruangan) {
            return res.status(404).json({ message: 'Ruangan tidak ditemukan' });
        }

        const biayaAkhir = biaya_per_hari || ruangan.biaya_per_hari || 0;

        let lamaInap = parseInt(lama_inap) || 1;
        if (lamaInap < 1) lamaInap = 1;

        const totalBiayaRawat = biayaAkhir * lamaInap;

        if (status === 'terisi' && id_pasien) {
            await prisma.$transaction(async (tx) => {
                await tx.ruangan.update({
                    where: { id },
                    data: {
                        status: 'terisi',
                        ditempati: id_pasien,
                        biaya_per_hari: biayaAkhir,
                        tanggal_checkin: new Date().toISOString(),
                        lama_inap: lamaInap
                    }
                });

                await tx.pasien.update({
                    where: { id: id_pasien },
                    data: { msh_dirawat: 'dirawat' }
                });
            });

            console.log('[BACKEND] Status pasien diupdate menjadi dirawat, lama_inap:', lamaInap);
        } else if (status === 'kosong') {
            await prisma.$transaction(async (tx) => {
                await tx.ruangan.update({
                    where: { id },
                    data: {
                        status: 'kosong',
                        ditempati: null,
                        tanggal_checkin: null,
                        lama_inap: null
                    }
                });

                if (id_pasien) {
                    // Cek apakah pasien masih dirawat di ruangan lain
                    const ruanganLain = await tx.ruangan.count({
                        where: { ditempati: id_pasien, status: 'terisi' }
                    });

                    if (ruanganLain === 0) {
                        await tx.pasien.update({
                            where: { id: id_pasien },
                            data: { msh_dirawat: 'pulang' }
                        });
                    }

                    // Cek tagihan existing
                    const existingTagihan = await tx.tagihan.findFirst({
                        where: { id_pasien: id_pasien, status: 'belum' }
                    });

                    if (existingTagihan) {
                        await tx.tagihan.update({
                            where: { id: existingTagihan.id },
                            data: { total_biaya: { increment: totalBiayaRawat } }
                        });
                        await tx.ruangan.update({
                            where: { id },
                            data: { id_tagihan: existingTagihan.id }
                        });
                    } else {
                        const pasien = await tx.pasien.findUnique({ where: { id: id_pasien } });
                        if (pasien?.msh_dirawat === 'pulang') {
                            const newTagihan = await tx.tagihan.create({
                                data: {
                                    id_pasien: id_pasien,
                                    total_biaya: totalBiayaRawat,
                                    status: 'belum',
                                    tanggal_tagihan: new Date().toISOString().split('T')[0],
                                    keterangan: 'Tagihan otomatis dari rawat inap'
                                }
                            });
                            await tx.ruangan.update({
                                where: { id },
                                data: { id_tagihan: newTagihan.id }
                            });
                        }
                    }

                    // Notifikasi
                    await tx.notifikasi.create({
                        data: {
                            jenis: 'pasien_pulang',
                            pesan: `Pasien ID ${id_pasien} sudah keluar dari ruangan. Tagihan otomatis diupdate.`,
                            tanggal: new Date().toISOString(),
                            dibaca: false
                        }
                    });
                }
            });
        } else {
            // Just update status only
            const updateData = { status };
            if (status === 'terisi' && id_pasien) {
                updateData.ditempati = id_pasien;
                updateData.biaya_per_hari = biayaAkhir;
            } else if (status === 'kosong') {
                updateData.ditempati = null;
                updateData.tanggal_checkin = null;
                updateData.lama_inap = null;
            }

            await prisma.ruangan.update({
                where: { id },
                data: updateData
            });
        }

        res.json({ message: 'Status ruangan berhasil diubah dan tagihan otomatis diupdate' });
    } catch (err) {
        console.error('[BACKEND] Error updateRuanganStatus:', err);
        handleError(res, err);
    }
};

// ==================== UPDATE SHIFT STAFF ====================
const updateShiftStaff = async (req, res) => {
    try {
        const { id_staff, hari, shift } = req.body;
        if (!id_staff || !hari || !shift) {
            return res.status(400).json({ message: 'Data tidak lengkap' });
        }
        await prisma.shiftStaff.deleteMany({ where: { id_staff } });
        const days = Array.isArray(hari) ? hari : [hari];
        for (const day of days) {
            await prisma.shiftStaff.create({
                data: { id_staff, hari: day, shift }
            });
        }
        res.json({ message: 'Shift staff berhasil diubah' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== UPDATE SHIFT USER ====================
const updateShiftUser = async (req, res) => {
    try {
        const { id_users, hari, shift } = req.body;
        if (!id_users || !hari || !shift) {
            return res.status(400).json({ message: 'Data tidak lengkap' });
        }
        await prisma.shiftUser.deleteMany({ where: { id_users } });
        const days = Array.isArray(hari) ? hari : [hari];
        for (const day of days) {
            await prisma.shiftUser.create({
                data: { id_users, hari: day, shift }
            });
        }
        res.json({ message: 'Shift user berhasil diubah' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== UPDATE RUANGAN ====================
const updateRuangan = async (req, res) => {
    try {
        const id = req.params.id;
        const { nama_ruangan, nomor_ruangan, status, ditempati, biaya_per_hari } = req.body;

        console.log('[BACKEND] updateRuangan:', { id, nama_ruangan, nomor_ruangan, status, ditempati, biaya_per_hari });

        if (!nama_ruangan) {
            return res.status(400).json({ message: 'Nama ruangan wajib diisi' });
        }

        // Sanitasi numerik
        const nomorRuanganVal = toInt(nomor_ruangan, 'Nomor ruangan');
        if (nomorRuanganVal.error) return res.status(400).json({ message: nomorRuanganVal.error });
        if (!nomorRuanganVal.value || nomorRuanganVal.value <= 0) {
            return res.status(400).json({ message: 'Nomor ruangan wajib diisi' });
        }
        const biayaPerHariVal = toFloat(biaya_per_hari, 'Biaya per hari');
        if (biayaPerHariVal.error) return res.status(400).json({ message: biayaPerHariVal.error });

        const existing = await prisma.ruangan.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Ruangan tidak ditemukan' });
        }

        await prisma.ruangan.update({
            where: { id },
            data: {
                nama_ruangan,
                nomor_ruangan: nomorRuanganVal.value,
                status,
                ditempati: ditempati || null,
                biaya_per_hari: biayaPerHariVal.value ?? 0
            }
        });

        res.json({ message: 'Ruangan berhasil diupdate' });
    } catch (err) {
        console.error('[BACKEND] Error updateRuangan:', err);
        handleError(res, err);
    }
};

// ==================== DELETE PASIEN ====================
const deletePasien = async (req, res) => {
    try {
        const id = req.params.id;

        const pasien = await prisma.pasien.findUnique({ where: { id } });
        if (!pasien) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Delete checkups yang refer ke pasien
            await tx.checkUp.deleteMany({ where: { id_pasien: id } });

            // 2. Delete riwayat_obat
            await tx.riwayatObat.deleteMany({ where: { id_pasien: id } });

            // 3. Set null di ruangan (ON DELETE SET NULL analog)
            await tx.ruangan.updateMany({
                where: { ditempati: id },
                data: { ditempati: null, status: 'kosong', id_tagihan: null }
            });

            // 4. Delete tagihan
            await tx.tagihan.deleteMany({ where: { id_pasien: id } });

            // 5. Delete pasien itu sendiri
            await tx.pasien.delete({ where: { id } });
        });

        res.json({
            message: 'Pasien dan semua data terkait berhasil dihapus otomatis!',
            deleted: { pasien: 1 }
        });
    } catch (err) {
        console.error('[DELETE PASIEN] Error:', err);
        handleError(res, err);
    }
};

// ==================== DELETE BAYI ====================
const deleteBayi = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma.bayi.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Bayi tidak ditemukan' });
        }
        await prisma.bayi.delete({ where: { id } });
        res.json({ message: 'Bayi berhasil dihapus' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== DELETE DOKTER ====================
const deleteDokter = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma.dokter.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Dokter tidak ditemukan' });
        }

        const userId = existing.userId;

        await prisma.$transaction(async (tx) => {
            // Cleanup: nullify id_dokter di check_up yang refer
            await tx.checkUp.updateMany({
                where: { id_dokter: id },
                data: { id_dokter: null }
            });
            // Hapus shift user terkait
            await tx.shiftUser.deleteMany({
                where: { id_users: userId }
            });
            // Hapus profile dokter
            await tx.dokter.delete({ where: { id } });
            // Hapus akun login
            await tx.user.delete({ where: { id: userId } });
        });

        res.json({ message: 'Dokter dan akun login berhasil dihapus' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== DELETE RUANGAN ====================
const deleteRuangan = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma.ruangan.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Ruangan tidak ditemukan' });
        }
        await prisma.ruangan.delete({ where: { id } });
        res.json({ message: 'Ruangan berhasil dihapus' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== DELETE STAFF ====================
const deleteStaff = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma.staff.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Staff tidak ditemukan' });
        }
        await prisma.staff.delete({ where: { id } });
        res.json({ message: 'Staff berhasil dihapus' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== BATAL CHECKUP ====================
const batalCheckup = async (req, res) => {
    try {
        const id = req.params.id;

        const checkup = await prisma.checkUp.findUnique({ where: { id } });
        if (!checkup) {
            return res.status(404).json({ message: 'Checkup tidak ditemukan' });
        }

        if (checkup.status !== 'terjadwal') {
            return res.status(400).json({
                message: 'Checkup sudah selesai atau batal, tidak bisa dibatalkan lagi'
            });
        }

        await prisma.checkUp.update({
            where: { id },
            data: { status: 'batal' }
        });

        res.json({ message: 'Checkup berhasil dibatalkan' });
    } catch (err) {
        console.error('[ERROR] batalCheckup:', err);
        handleError(res, err);
    }
};

// ==================== EXPORT ====================
module.exports = {
    getPasien,
    getBayi,
    getDokter,
    addPasien,
    getStaff,
    addStaff,
    addBayi,
    getRuanganStatus,
    getNotifikasiDarurat,
    markNotifikasiDibaca,
    getPasienCheckInOut,
    getPasienWithFilter,
    getBayiWithFilter,
    getCheckup,
    addCheckup,
    getDokterWithFilter,
    getRuanganWithFilter,
    getStaffWithFilter,
    getCheckupWithFilter,
    updateDokter,
    updateStaff,
    updatePasien,
    updateCheckup,
    getShiftJadwal,
    addShift,
    updateShiftStaff,
    updateShiftUser,
    updateBayi,
    updateRuanganStatus,
    getUsers,
    updateRuangan,
    deletePasien,
    batalCheckup,
    getJadwalCheckup,
    getSudahCheckout,
    deleteBayi,
    deleteDokter,
    deleteRuangan,
    deleteStaff
};
