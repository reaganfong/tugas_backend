const db = require('../config/db');

// ==================== GET PASIEN CHECK IN OUT ====================
const getPasienCheckInOut = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.id_checkup, p.nama AS nama_pasien, d.nama_dokter,
                   c.tanggal, c.jam, c.checkout, c.keterangan, c.biaya_checkup
            FROM check_up c
            LEFT JOIN pasien p ON c.id_pasien = p.id_pasien
            LEFT JOIN dokter d ON c.id_dokter = d.id_dokter
            ORDER BY c.tanggal DESC, c.jam DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET PASIEN ====================
const getPasien = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM pasien`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ===== GET PASIEN DENGAN SEARCH + PAGINATION =====
const getPasienWithFilter = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (search && search.trim() !== '') {
            whereClause += ' AND (nama LIKE ? OR nama_wali LIKE ?)';
            const like = `%${search.trim()}%`;
            params.push(like, like);
        }
        
        if (status === 'dirawat') {
            whereClause += ' AND msh_dirawat = "dirawat"';
        } else if (status === 'pulang') {
            whereClause += ' AND msh_dirawat = "pulang"';
        } else if (status === 'baru') {
            whereClause += ' AND msh_dirawat = "baru"';
        }
        
        const countQuery = `SELECT COUNT(*) as total FROM pasien ${whereClause}`;
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0]?.total || 0;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const dataQuery = `SELECT * FROM pasien ${whereClause} ORDER BY id_pasien DESC LIMIT ? OFFSET ?`;
        const dataParams = [...params, parseInt(limit), offset];
        
        const [rows] = await db.query(dataQuery, dataParams);
        
        const formattedData = rows.map(row => ({
            ...row,
            status_display: row.msh_dirawat === 'baru' ? 'Baru' : 
                           row.msh_dirawat === 'dirawat' ? 'Dirawat' : 'Pulang',
            is_dirawat: row.msh_dirawat === 'dirawat'
        }));
        
        res.json({
            data: formattedData,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (err) {
        console.error('[ERROR] getPasienWithFilter:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET BAYI ====================
const getBayi = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM bayi');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET BAYI DENGAN FILTER + PAGINATION ====================
const getBayiWithFilter = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (search && search.trim() !== '') {
            whereClause += ' AND (nama_bayi LIKE ? OR nama_ibu LIKE ?)';
            const like = `%${search.trim()}%`;
            params.push(like, like);
        }
        
        const countQuery = `SELECT COUNT(*) as total FROM bayi ${whereClause}`;
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0]?.total || 0;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const dataQuery = `SELECT * FROM bayi ${whereClause} ORDER BY id_bayi DESC LIMIT ? OFFSET ?`;
        const dataParams = [...params, parseInt(limit), offset];
        
        const [rows] = await db.query(dataQuery, dataParams);
        
        res.json({
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET DOKTER ====================
const getDokter = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM dokter');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET DOKTER DENGAN FILTER + PAGINATION ====================
const getDokterWithFilter = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (search && search.trim() !== '') {
            whereClause += ' AND (nama_dokter LIKE ? OR spesialisasi LIKE ?)';
            const like = `%${search.trim()}%`;
            params.push(like, like);
        }
        
        const countQuery = `SELECT COUNT(*) as total FROM dokter ${whereClause}`;
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0]?.total || 0;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const dataQuery = `SELECT * FROM dokter ${whereClause} ORDER BY id_dokter DESC LIMIT ? OFFSET ?`;
        const dataParams = [...params, parseInt(limit), offset];
        
        const [rows] = await db.query(dataQuery, dataParams);
        
        res.json({
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET STAFF ====================
const getStaff = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM staff');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET STAFF DENGAN FILTER + PAGINATION ====================
const getStaffWithFilter = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (search && search.trim() !== '') {
            whereClause += ' AND (nama_staff LIKE ? OR jabatan LIKE ?)';
            const like = `%${search.trim()}%`;
            params.push(like, like);
        }
        
        const countQuery = `SELECT COUNT(*) as total FROM staff ${whereClause}`;
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0]?.total || 0;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const dataQuery = `SELECT * FROM staff ${whereClause} ORDER BY id_staff DESC LIMIT ? OFFSET ?`;
        const dataParams = [...params, parseInt(limit), offset];
        
        const [rows] = await db.query(dataQuery, dataParams);
        
        res.json({
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET USERS ====================
const getUsers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, jabatan FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== ADD STAFF ====================
const addStaff = async (req, res) => {
    try {
        const { jabatan, nama_staff, no_telepon, gaji, hari, shift } = req.body;

        if (!nama_staff) {
            return res.status(400).json({ message: 'Nama wajib diisi' });
        }

        if (gaji == null || gaji === '') {
            return res.status(400).json({ message: 'Gaji wajib diisi' });
        }

        const parsedGaji = Number(gaji);
        if (Number.isNaN(parsedGaji)) {
            return res.status(400).json({ message: 'Gaji harus berupa angka' });
        }

        const [result] = await db.query(
            'INSERT INTO staff (jabatan, nama_staff, no_telepon, gaji) VALUES (?, ?, ?, ?)',
            [jabatan || null, nama_staff, no_telepon || null, parsedGaji]
        );

        const staffId = result.insertId;

        if (hari && shift) {
            const days = Array.isArray(hari) ? hari : String(hari).split(',').map(s => s.trim()).filter(Boolean);
            const allowedDays = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
            const allowedShifts = ['Shift I','Shift II','Shift III'];
            const inserts = [];

            for (const h of days) {
                if (!allowedDays.includes(h)) continue;
                if (!allowedShifts.includes(shift)) continue;
                inserts.push(db.query('INSERT INTO shift_staff (id_staff, hari, shift) VALUES (?, ?, ?)', [staffId, h, shift]));
            }

            if (inserts.length) await Promise.all(inserts);
        }

        res.json({ message: 'Staff berhasil ditambahkan', id: staffId });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET RUANGAN STATUS ====================
const getRuanganStatus = async (req, res) => {
    try {
        const { nama } = req.params;
        let query = `
            SELECT r.*, p.nama AS nama_pasien,
                   DATEDIFF(NOW(), r.tanggal_checkin) AS lama_inap_hari
            FROM ruangan r
            LEFT JOIN pasien p ON r.ditempati = p.id_pasien
        `;
        let params = [];
        if (nama) {
            query += ' WHERE r.nama_ruangan = ?';
            params.push(nama);
        }
        
        const [rows] = await db.query(query, params);
        
        const formatted = rows.map(r => ({
            ...r,
            lama_inap: r.status === 'terisi' && r.tanggal_checkin ? r.lama_inap_hari || r.lama_inap || '?' : null
        }));
        
        res.json(formatted);
    } catch (err) {
        console.error('[ERROR] getRuanganStatus:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET RUANGAN DENGAN FILTER + PAGINATION ====================
const getRuanganWithFilter = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (search && search.trim() !== '') {
            whereClause += ' AND (r.nama_ruangan LIKE ? OR p.nama LIKE ?)';
            const like = `%${search.trim()}%`;
            params.push(like, like);
        }
        
        if (status && status.trim() !== '') {
            whereClause += ' AND r.status = ?';
            params.push(status);
        }
        
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM ruangan r
            LEFT JOIN pasien p ON r.ditempati = p.id_pasien
            ${whereClause}
        `;
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0]?.total || 0;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const dataQuery = `
            SELECT r.*, p.nama AS nama_pasien,
                   DATEDIFF(NOW(), r.tanggal_checkin) AS lama_inap_hari
            FROM ruangan r
            LEFT JOIN pasien p ON r.ditempati = p.id_pasien
            ${whereClause}
            ORDER BY r.id_ruangan DESC
            LIMIT ? OFFSET ?
        `;
        const dataParams = [...params, parseInt(limit), offset];
        
        const [rows] = await db.query(dataQuery, dataParams);
        
        const formatted = rows.map(r => ({
            ...r,
            lama_inap: r.status === 'terisi' && r.tanggal_checkin ? r.lama_inap_hari || r.lama_inap || '?' : null
        }));
        
        res.json({
            data: formatted,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (err) {
        console.error('[ERROR] getRuanganWithFilter:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== NOTIFIKASI ====================
const getNotifikasiDarurat = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM notifikasi WHERE dibaca = FALSE ORDER BY tanggal DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const markNotifikasiDibaca = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await db.query('UPDATE notifikasi SET dibaca = TRUE WHERE id_notif = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
        }
        res.json({ message: 'Notifikasi ditandai sudah dibaca' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET CHECKUP ====================
const getCheckup = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.id_checkup, c.id_pasien, c.id_dokter, p.nama AS nama_pasien, d.nama_dokter, 
                   c.jam, c.tanggal, c.checkout, c.keterangan, c.status, c.biaya_checkup
            FROM check_up c
            LEFT JOIN pasien p ON c.id_pasien = p.id_pasien
            LEFT JOIN dokter d ON c.id_dokter = d.id_dokter
            ORDER BY c.tanggal DESC, c.jam DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET CHECKUP DENGAN FILTER + PAGINATION ====================
const getCheckupWithFilter = async (req, res) => {
    try {
        const { search, searchType, status, page = 1, limit = 10 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (search && search.trim() !== '') {
            const like = `%${search.trim()}%`;
            
            if (searchType === 'pasien') {
                whereClause += ' AND p.nama LIKE ?';
                params.push(like);
            } else if (searchType === 'dokter') {
                whereClause += ' AND d.nama_dokter LIKE ?';
                params.push(like);
            } else {
                whereClause += ' AND (p.nama LIKE ? OR d.nama_dokter LIKE ?)';
                params.push(like, like);
            }
        }
        
        if (status && status.trim() !== '') {
            whereClause += ' AND c.status = ?';
            params.push(status);
        }
        
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM check_up c
            LEFT JOIN pasien p ON c.id_pasien = p.id_pasien
            LEFT JOIN dokter d ON c.id_dokter = d.id_dokter
            ${whereClause}
        `;
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0]?.total || 0;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const dataQuery = `
            SELECT c.*, p.nama AS nama_pasien, d.nama_dokter
            FROM check_up c
            LEFT JOIN pasien p ON c.id_pasien = p.id_pasien
            LEFT JOIN dokter d ON c.id_dokter = d.id_dokter
            ${whereClause}
            ORDER BY c.tanggal DESC, c.jam DESC
            LIMIT ? OFFSET ?
        `;
        const dataParams = [...params, parseInt(limit), offset];
        
        const [rows] = await db.query(dataQuery, dataParams);
        
        res.json({
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET JADWAL CHECKUP (BELUM CHECKOUT) ====================
const getJadwalCheckup = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.id_checkup, c.id_pasien, c.id_dokter, p.nama AS nama_pasien, d.nama_dokter, 
                   c.jam, c.tanggal, c.keterangan, c.biaya_checkup, c.status
            FROM check_up c
            LEFT JOIN pasien p ON c.id_pasien = p.id_pasien
            LEFT JOIN dokter d ON c.id_dokter = d.id_dokter
            WHERE c.status = 'terjadwal'
            ORDER BY c.tanggal DESC, c.jam DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET SUDAH CHECKOUT (SELESAI + BATAL) ====================
const getSudahCheckout = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.id_checkup, c.id_pasien, c.id_dokter, p.nama AS nama_pasien, d.nama_dokter, 
                   c.jam, c.tanggal, c.checkout, c.keterangan, c.status, c.biaya_checkup
            FROM check_up c
            LEFT JOIN pasien p ON c.id_pasien = p.id_pasien
            LEFT JOIN dokter d ON c.id_dokter = d.id_dokter
            WHERE c.status IN ('selesai', 'batal')
            ORDER BY c.tanggal DESC, c.jam DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== ADD CHECKUP ====================
const addCheckup = async (req, res) => {
    try {
        const { id_pasien, id_dokter, jam, tanggal, biaya_checkup, keterangan } = req.body;
        
        if (!id_pasien || !id_dokter || !tanggal || !jam) {
            return res.status(400).json({ message: 'Data checkup tidak lengkap' });
        }
        
        const [pasienRows] = await db.query(
            'SELECT msh_dirawat FROM pasien WHERE id_pasien = ?',
            [id_pasien]
        );
        
        if (pasienRows.length === 0) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }
        
        const [ruanganCek] = await db.query(
            'SELECT COUNT(*) as total FROM ruangan WHERE ditempati = ? AND status = "terisi"',
            [id_pasien]
        );
        
        if (parseInt(ruanganCek[0].total) > 0) {
            return res.status(400).json({ 
                message: 'Pasien sedang rawat inap! Tidak bisa checkup. Pulangkan pasien dari ruangan terlebih dahulu.' 
            });
        }
        
        const [dokterRows] = await db.query(
            'SELECT id_dokter FROM dokter WHERE id_dokter = ?',
            [id_dokter]
        );
        if (dokterRows.length === 0) {
            return res.status(404).json({ message: 'Dokter tidak ditemukan' });
        }
        
        const biaya = parseFloat(biaya_checkup) || 0;
        
        await db.query(
            `INSERT INTO check_up (id_pasien, id_dokter, jam, tanggal, biaya_checkup, keterangan, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'terjadwal')`,
            [id_pasien, id_dokter, jam, tanggal, biaya, keterangan || null]
        );
        
        res.json({ message: 'Checkup berhasil ditambahkan' });
        
    } catch (err) {
        console.error('[BACKEND] Error addCheckup:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE DOKTER ====================
const updateDokter = async (req, res) => {
    try {
        const id = Number(req.params.id);
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

        const [result] = await db.query(
            `UPDATE dokter SET nama_dokter = ?, spesialisasi = ?, umur = ?, no_telepon = ?, biaya_honor = ? WHERE id_dokter = ?`,
            [nama_dokter, spesialisasi || null, umur || null, no_telepon || null, biaya_honor || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Dokter tidak ditemukan' });
        }
        
        await db.query('DELETE FROM shift_users WHERE id_users = ?', [id]);
        
        if (hari && shift) {
            const days = Array.isArray(hari) ? hari : String(hari).split(',').map(s => s.trim()).filter(Boolean);
            const allowedDays = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
            const allowedShifts = ['Shift I','Shift II','Shift III'];
            for (const h of days) {
                if (allowedDays.includes(h) && allowedShifts.includes(shift)) {
                    await db.query('INSERT INTO shift_users (id_users, hari, shift) VALUES (?, ?, ?)', [id, h, shift]);
                }
            }
        }
        
        res.json({ message: 'Data dokter berhasil diubah' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE STAFF ====================
const updateStaff = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nama_staff, jabatan, no_telepon, gaji, hari, shift } = req.body;
        if (!nama_staff) return res.status(400).json({ message: 'Nama staff wajib diisi' });
        const parsedGaji = Number(gaji);
        if (isNaN(parsedGaji)) return res.status(400).json({ message: 'Gaji harus angka' });
        
        const [result] = await db.query(
            'UPDATE staff SET nama_staff = ?, jabatan = ?, no_telepon = ?, gaji = ? WHERE id_staff = ?',
            [nama_staff, jabatan || null, no_telepon || null, parsedGaji, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Staff tidak ditemukan' });
        
        await db.query('DELETE FROM shift_staff WHERE id_staff = ?', [id]);
        
        if (hari && shift) {
            const days = Array.isArray(hari) ? hari : String(hari).split(',').map(s => s.trim()).filter(Boolean);
            const allowedDays = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
            const allowedShifts = ['Shift I','Shift II','Shift III'];
            for (const h of days) {
                if (allowedDays.includes(h) && allowedShifts.includes(shift)) {
                    await db.query('INSERT INTO shift_staff (id_staff, hari, shift) VALUES (?, ?, ?)', [id, h, shift]);
                }
            }
        }
        
        res.json({ message: 'Data staff berhasil diubah' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE PASIEN ====================
const updatePasien = async (req, res) => {
    try {
        console.log('[ADMIN] updatePasien called, id=', req.params.id);
        const id = Number(req.params.id);
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

        const [result] = await db.query(
            `UPDATE pasien SET nama = ?, nama_wali = ?, jenis_penyakit = ?, nama_penyakit = ?, umur = ?, jenis_kelamin = ?, no_telp_pasien = ?, no_telp_wali = ?, deskripsi_dokter = ? WHERE id_pasien = ?`,
            [nama, nama_wali || null, jenis_penyakit || null, nama_penyakit || null, umur || null, jenis_kelamin || null, no_telp_pasien || null, no_telp_wali || null, deskripsi_dokter || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }

        res.json({ message: 'Data pasien berhasil diubah' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE CHECKUP ====================
const updateCheckup = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { id_pasien, id_dokter, jam, tanggal, checkout, status, keterangan, biaya_checkup } = req.body;
        
        const patientId = id_pasien ? Number(id_pasien) : null;
        const doctorId = id_dokter ? Number(id_dokter) : null;
        
        if (!patientId || !doctorId || !tanggal || !jam) {
            return res.status(400).json({ message: 'ID pasien, ID dokter, tanggal dan jam checkin wajib diisi' });
        }
        
        const [result] = await db.query(
            `UPDATE check_up SET id_pasien = ?, id_dokter = ?, jam = ?, tanggal = ?, 
             checkout = ?, status = ?, keterangan = ?, biaya_checkup = ? WHERE id_checkup = ?`,
            [patientId, doctorId, jam, tanggal, checkout || null, status || null, keterangan || null, biaya_checkup || 0, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Checkup tidak ditemukan' });
        }
        res.json({ message: 'Data checkup berhasil diubah' });
    } catch (err) {
        res.status(500).json({ message: err.message });
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

        const [existing] = await db.query(
            'SELECT id_pasien FROM pasien WHERE nama = ? AND no_telp_pasien = ?',
            [nama, no_telp_pasien]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ 
                message: 'Pasien dengan nama dan no telepon ini sudah terdaftar! ID: ' + existing[0].id_pasien 
            });
        }
        
        const [result] = await db.query(
            `INSERT INTO pasien 
            (nama, nama_wali, umur, jenis_kelamin, no_telp_pasien, no_telp_wali, msh_dirawat)
            VALUES (?, ?, ?, ?, ?, ?, 'baru')`,
            [nama, nama_wali || null, umur || null, jenis_kelamin || null, no_telp_pasien || null, no_telp_wali || null]
        );

        res.json({ message: 'Pasien berhasil ditambahkan', id: result.insertId });

    } catch (err) {
        console.error('[ERROR] addPasien:', err);
        res.status(500).json({ message: err.message });
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

        const [lastRow] = await db.query('SELECT MAX(id_ibu) as max_id FROM bayi');
        const newIdIbu = (lastRow[0]?.max_id || 0) + 1;

        const [result] = await db.query(
            'INSERT INTO bayi (id_ibu, nama_ibu, nama_bayi, jenis_kelamin, berat, tinggi) VALUES (?, ?, ?, ?, ?, ?)',
            [newIdIbu, nama_ibu, nama_bayi || null, jenis_kelamin || null, berat || null, tinggi || null]
        );

        res.json({ 
            message: 'Bayi berhasil ditambahkan', 
            id: result.insertId,
            id_ibu: newIdIbu 
        });

    } catch (err) {
        console.error('[ERROR] addBayi:', err);  
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE BAYI ====================
const updateBayi = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { id_ibu, nama_ibu, nama_bayi, jenis_kelamin, berat, tinggi } = req.body;
        
        const [result] = await db.query(
            'UPDATE bayi SET id_ibu = ?, nama_ibu = ?, nama_bayi = ?, jenis_kelamin = ?, berat = ?, tinggi = ? WHERE id_bayi = ?',
            [id_ibu || null, nama_ibu || null, nama_bayi || null, jenis_kelamin || null, berat || null, tinggi || null, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Bayi tidak ditemukan' });
        }
        res.json({ message: 'Data bayi berhasil diubah' });
    } catch (err) {
        res.status(500).json({ message: err.message });
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
        
        const table = tipe === 'staff' ? 'shift_staff' : 'shift_users';
        const idColumn = tipe === 'staff' ? 'id_staff' : 'id_users';

        await db.query(`DELETE FROM ${table} WHERE ${idColumn} = ?`, [id]);
        
        const days = Array.isArray(hari) ? hari : [hari];
        let insertedCount = 0;
        
        for (const day of days) {
            const [result] = await db.query(
                `INSERT INTO ${table} (${idColumn}, hari, shift) VALUES (?, ?, ?)`,
                [id, day, shift]
            );
            if (result.affectedRows > 0) insertedCount++;
        }
        
        console.log(`[ADD SHIFT] Berhasil insert ${insertedCount} hari untuk ${tipe} ID ${id}`);
        
        res.json({ 
            message: `Shift berhasil ditambahkan! (${insertedCount} hari)`,
            inserted: insertedCount,
            total: days.length
        });
        
    } catch (err) {
        console.error('[ERROR] addShift:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET SHIFT JADWAL ====================
const getShiftJadwal = async (req, res) => {
    try {
        const { hari, shift } = req.query;
        
        let queryStaff = `SELECT s.id_staff, s.nama_staff, ss.hari, ss.shift, 'staff' as tipe FROM shift_staff ss JOIN staff s ON ss.id_staff = s.id_staff WHERE 1=1`;
        let queryUsers = `SELECT u.id, u.username, su.hari, su.shift, 'user' as tipe FROM shift_users su JOIN users u ON su.id_users = u.id WHERE 1=1`;
        
        let paramsStaff = [];
        let paramsUsers = [];
        
        if (hari) {
            queryStaff += ` AND ss.hari = ?`;
            queryUsers += ` AND su.hari = ?`;
            paramsStaff.push(hari);
            paramsUsers.push(hari);
        }
        if (shift) {
            queryStaff += ` AND ss.shift = ?`;
            queryUsers += ` AND su.shift = ?`;
            paramsStaff.push(shift);
            paramsUsers.push(shift);
        }
        
        const [staffRows] = await db.query(queryStaff, paramsStaff);
        const [userRows] = await db.query(queryUsers, paramsUsers);
        
        res.json({ staff: staffRows, users: userRows });
    } catch (err) {
        console.error('[ERROR] getShiftJadwal:', err);      
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE RUANGAN STATUS ====================
const updateRuanganStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status, id_pasien, lama_inap, biaya_per_hari } = req.body;
        
        console.log('[BACKEND] updateRuanganStatus:', { id, status, id_pasien, lama_inap, biaya_per_hari });
        
        if (!status) {
            return res.status(400).json({ message: 'Status wajib diisi' });
        }
        
        const [ruangan] = await db.query(
            'SELECT biaya_per_hari, nama_ruangan FROM ruangan WHERE id_ruangan = ?',
            [id]
        );
        if (ruangan.length === 0) {
            return res.status(404).json({ message: 'Ruangan tidak ditemukan' });
        }
        
        const biayaAkhir = biaya_per_hari || ruangan[0].biaya_per_hari || 0;
        
        // ✅ PASTIKAN lama_inap TIDAK NULL
        let lamaInap = parseInt(lama_inap) || 1;
        if (lamaInap < 1) lamaInap = 1;
        
        const totalBiayaRawat = biayaAkhir * lamaInap;
        
        let query = 'UPDATE ruangan SET status = ?, ditempati = ?, biaya_per_hari = ?';
        let params = [status, status === 'terisi' ? id_pasien : null, biayaAkhir];
        
        if (status === 'terisi' && id_pasien) {
            // ✅ PASTIKAN lama_inap TERSIMPAN
            query += ', tanggal_checkin = NOW(), lama_inap = ?';
            params.push(lamaInap);
            
            await db.query(
                'UPDATE pasien SET msh_dirawat = "dirawat" WHERE id_pasien = ?',
                [id_pasien]
            );
            console.log('[BACKEND] Status pasien diupdate menjadi dirawat, lama_inap:', lamaInap);
        } else if (status === 'kosong') {
            query += ', tanggal_checkin = NULL, lama_inap = NULL';
        }
        
        query += ' WHERE id_ruangan = ?';
        params.push(id);
        
        await db.query(query, params);
        
        if (status === 'kosong' && id_pasien) {
            const [cekRuangan] = await db.query(
                'SELECT COUNT(*) as total FROM ruangan WHERE ditempati = ? AND status = "terisi"',
                [id_pasien]
            );
            
            if (parseInt(cekRuangan[0].total) === 0) {
                await db.query(
                    'UPDATE pasien SET msh_dirawat = "pulang" WHERE id_pasien = ?',
                    [id_pasien]
                );
            }
            
            const [existing] = await db.query(
                'SELECT id_tagihan FROM tagihan WHERE id_pasien = ? AND status = "belum"',
                [id_pasien]
            );
            
            if (existing.length > 0) {
                await db.query(
                    'UPDATE tagihan SET total_biaya = total_biaya + ? WHERE id_tagihan = ?',
                    [totalBiayaRawat, existing[0].id_tagihan]
                );
                await db.query(
                    'UPDATE ruangan SET id_tagihan = ? WHERE id_ruangan = ?',
                    [existing[0].id_tagihan, id]
                );
            } else {
                const [pasien] = await db.query(
                    'SELECT msh_dirawat FROM pasien WHERE id_pasien = ?',
                    [id_pasien]
                );
                
                if (pasien[0]?.msh_dirawat === 'pulang') {
                    const [newTagihan] = await db.query(
                        `INSERT INTO tagihan (id_pasien, total_biaya, status, tanggal_tagihan, keterangan) 
                         VALUES (?, ?, 'belum', CURDATE(), ?)`,
                        [id_pasien, totalBiayaRawat, `Tagihan otomatis dari rawat inap`]
                    );
                    await db.query(
                        'UPDATE ruangan SET id_tagihan = ? WHERE id_ruangan = ?',
                        [newTagihan.insertId, id]
                    );
                }
            }
            
            await db.query(
                `INSERT INTO notifikasi (jenis, pesan, tanggal, dibaca) 
                 VALUES (?, ?, NOW(), FALSE)`,
                ['pasien_pulang', `Pasien ID ${id_pasien} sudah keluar dari ruangan. Tagihan otomatis diupdate.`]
            );
        }
        
        res.json({ message: 'Status ruangan berhasil diubah dan tagihan otomatis diupdate' });
        
    } catch (err) {
        console.error('[BACKEND] Error updateRuanganStatus:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE SHIFT STAFF ====================
const updateShiftStaff = async (req, res) => {
    try {
        const { id_staff, hari, shift } = req.body;
        if (!id_staff || !hari || !shift) {
            return res.status(400).json({ message: 'Data tidak lengkap' });
        }
        await db.query('DELETE FROM shift_staff WHERE id_staff = ?', [id_staff]);
        const days = Array.isArray(hari) ? hari : [hari];
        for (const day of days) {
            await db.query('INSERT INTO shift_staff (id_staff, hari, shift) VALUES (?, ?, ?)', [id_staff, day, shift]);
        }
        res.json({ message: 'Shift staff berhasil diubah' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE SHIFT USER ====================
const updateShiftUser = async (req, res) => {
    try {
        const { id_users, hari, shift } = req.body;
        if (!id_users || !hari || !shift) {
            return res.status(400).json({ message: 'Data tidak lengkap' });
        }
        await db.query('DELETE FROM shift_users WHERE id_users = ?', [id_users]);
        const days = Array.isArray(hari) ? hari : [hari];
        for (const day of days) {
            await db.query('INSERT INTO shift_users (id_users, hari, shift) VALUES (?, ?, ?)', [id_users, day, shift]);
        }
        res.json({ message: 'Shift user berhasil diubah' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE RUANGAN ====================
const updateRuangan = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nama_ruangan, nomor_ruangan, status, ditempati, biaya_per_hari } = req.body;
        
        console.log('[BACKEND] updateRuangan:', { id, nama_ruangan, nomor_ruangan, status, ditempati, biaya_per_hari });
        
        if (!nama_ruangan) {
            return res.status(400).json({ message: 'Nama ruangan wajib diisi' });
        }
        if (!nomor_ruangan || nomor_ruangan <= 0) {
            return res.status(400).json({ message: 'Nomor ruangan wajib diisi' });
        }
        
        const [ruangan] = await db.query('SELECT id_ruangan FROM ruangan WHERE id_ruangan = ?', [id]);
        if (ruangan.length === 0) {
            return res.status(404).json({ message: 'Ruangan tidak ditemukan' });
        }
        
        const [result] = await db.query(
            `UPDATE ruangan 
             SET nama_ruangan = ?, nomor_ruangan = ?, status = ?, ditempati = ?, biaya_per_hari = ? 
             WHERE id_ruangan = ?`,
            [nama_ruangan, nomor_ruangan, status, ditempati || null, biaya_per_hari || 0, id]
        );
        
        res.json({ message: 'Ruangan berhasil diupdate' });
        
    } catch (err) {
        console.error('[BACKEND] Error updateRuangan:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== DELETE PASIEN ====================
const deletePasien = async (req, res) => {
    try {
        const id = Number(req.params.id);
        
        const [pasien] = await db.query('SELECT nama FROM pasien WHERE id_pasien = ?', [id]);
        if (pasien.length === 0) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }
        
        await db.query(
            'UPDATE ruangan SET ditempati = NULL, status = "kosong", id_tagihan = NULL WHERE ditempati = ?',
            [id]
        );
        
        const [result] = await db.query('DELETE FROM pasien WHERE id_pasien = ?', [id]);
        
        res.json({ 
            message: 'Pasien dan semua data terkait berhasil dihapus otomatis!',
            deleted: { pasien: result.affectedRows }
        });
        
    } catch (err) {
        console.error('[DELETE] Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== DELETE BAYI ====================
const deleteBayi = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await db.query('DELETE FROM bayi WHERE id_bayi = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Bayi tidak ditemukan' });
        }
        res.json({ message: 'Bayi berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== DELETE DOKTER ====================
const deleteDokter = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await db.query('DELETE FROM dokter WHERE id_dokter = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Dokter tidak ditemukan' });
        }
        res.json({ message: 'Dokter berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== DELETE RUANGAN ====================
const deleteRuangan = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await db.query('DELETE FROM ruangan WHERE id_ruangan = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ruangan tidak ditemukan' });
        }
        res.json({ message: 'Ruangan berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== DELETE STAFF ====================
const deleteStaff = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await db.query('DELETE FROM staff WHERE id_staff = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Staff tidak ditemukan' });
        }
        res.json({ message: 'Staff berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== BATAL CHECKUP ====================
const batalCheckup = async (req, res) => {
    try {
        const id = Number(req.params.id);
        
        const [checkup] = await db.query(
            'SELECT id_checkup, id_pasien, status FROM check_up WHERE id_checkup = ?',
            [id]
        );
        
        if (checkup.length === 0) {
            return res.status(404).json({ message: 'Checkup tidak ditemukan' });
        }
        
        if (checkup[0].status !== 'terjadwal') {
            return res.status(400).json({ 
                message: 'Checkup sudah selesai atau batal, tidak bisa dibatalkan lagi' 
            });
        }
        
        await db.query(
            'UPDATE check_up SET status = "batal" WHERE id_checkup = ?',
            [id]
        );
        
        res.json({ message: 'Checkup berhasil dibatalkan' });
        
    } catch (err) {
        console.error('[ERROR] batalCheckup:', err);
        res.status(500).json({ message: err.message });
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