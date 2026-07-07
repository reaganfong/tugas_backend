const db = require('../config/db');

// ==================== DASHBOARD DOKTER ====================
const getDashboardDokter = async (req, res) => {
    const dokterId = req.session.user?.id;
    try {
        const [[totalPasien]] = await db.query(
            'SELECT COUNT(*) AS total FROM check_up WHERE id_dokter = ?',
            [dokterId]
        );
        const [[hariIni]] = await db.query(
            'SELECT COUNT(*) AS total FROM check_up WHERE id_dokter = ? AND DATE(tanggal) = CURDATE()',
            [dokterId]
        );
        res.json({ totalPasien: totalPasien.total, pasienHariIni: hariIni.total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET JADWAL SAYA ====================
const getJadwalSaya = async (req, res) => {
    const dokterId = req.session.user?.id;
    try {
        const [rows] = await db.query(
            `SELECT c.id_checkup, c.id_pasien, p.nama AS nama_pasien,
                    c.jam, c.tanggal, c.biaya_checkup, c.checkout, c.status, c.keterangan
             FROM check_up c
             JOIN pasien p ON c.id_pasien = p.id_pasien
             WHERE c.id_dokter = ?
             ORDER BY c.tanggal DESC, c.jam DESC`,
            [dokterId]
        );
        res.json(rows);
    } catch (err) {
        console.error('[BACKEND] Error getJadwalSaya:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE DESKRIPSI PASIEN ====================
const updateDeskripsiPasien = async (req, res) => {
    const { id } = req.params;
    const { deskripsi } = req.body;
    try {
        await db.query('UPDATE pasien SET deskripsi_dokter = ? WHERE id_pasien = ?', [deskripsi, id]);
        res.json({ message: "OK" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== UPDATE CHECKUP STATUS (SELESAI) ====================
const updateCheckupStatus = async (req, res) => {
    const { id } = req.params;
    const { diagnosis, rekomendasi_obat } = req.body;
    const dokterId = req.session.user?.id;
    try {
        const [check] = await db.query(
            'SELECT id_checkup, id_pasien, keterangan FROM check_up WHERE id_checkup = ? AND id_dokter = ?',
            [id, dokterId]
        );
        if (check.length === 0) return res.status(404).json({ message: 'Checkup tidak ditemukan' });

        const idPasien = check[0].id_pasien;
        let query = 'UPDATE check_up SET status = "selesai", checkout = NOW()';
        let params = [];

        if (diagnosis && diagnosis.trim() !== '') {
            query += ', keterangan = ?';
            params.push(diagnosis);
        }
        if (rekomendasi_obat && rekomendasi_obat.trim() !== '') {
            query += ', rekomendasi_obat = ?';
            params.push(rekomendasi_obat);
        }
        query += ' WHERE id_checkup = ?';
        params.push(id);
        await db.query(query, params);

        if (diagnosis && diagnosis.trim() !== '') {
            await db.query('UPDATE pasien SET deskripsi_dokter = ? WHERE id_pasien = ?', [diagnosis, idPasien]);
        }

        res.json({ message: 'Status checkup diubah menjadi selesai' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET PASIEN SAYA ====================
const getPasienSaya = async (req, res) => {
    const dokterId = req.session.user?.id;
    const search = req.query.search || '';
    try {
        const [rows] = await db.query(
            `SELECT p.id_pasien, p.nama, p.umur, p.jenis_kelamin,
                    p.nama_penyakit, p.deskripsi_dokter, p.msh_dirawat,
                    MAX(c.jam) as jam,
                    MAX(c.tanggal) as tanggal
             FROM check_up c
             JOIN pasien p ON p.id_pasien = c.id_pasien
             WHERE c.id_dokter = ? AND p.nama LIKE ?
             GROUP BY p.id_pasien
             ORDER BY p.nama ASC`,
            [dokterId, `%${search}%`]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== DISCHARGE PASIEN ====================
const dischargePasien = async (req, res) => {
    const { id } = req.params;
    try {
        const [pasien] = await db.query('SELECT id_pasien, nama FROM pasien WHERE id_pasien = ?', [id]);
        if (pasien.length === 0) return res.status(404).json({ message: 'Pasien tidak ditemukan' });

        const [ruanganCek] = await db.query(
            'SELECT COUNT(*) as total FROM ruangan WHERE ditempati = ? AND status = "terisi"',
            [id]
        );
        if (parseInt(ruanganCek[0].total) > 0) {
            return res.status(400).json({ message: 'Pasien masih rawat inap! Pulangkan dari ruangan terlebih dahulu.' });
        }

        // ✅ UPDATE status pasien
        await db.query('UPDATE pasien SET msh_dirawat = "pulang" WHERE id_pasien = ?', [id]);

        // ✅ CEK tagihan existing
        let [existing] = await db.query(
            'SELECT id_tagihan FROM tagihan WHERE id_pasien = ? AND status = "belum"',
            [id]
        );

        let idTagihan;
        if (existing.length > 0) {
            idTagihan = existing[0].id_tagihan;
        } else {
            // ✅ BUAT tagihan baru
            const [newTagihan] = await db.query(
                `INSERT INTO tagihan (id_pasien, total_biaya, status, tanggal_tagihan, keterangan) 
                 VALUES (?, 0, 'belum', CURDATE(), ?)`,
                [id, `Tagihan otomatis untuk pasien ID ${id}`]
            );
            idTagihan = newTagihan.insertId;
        }

        // ✅ UPDATE semua checkup yang BELUM punya id_tagihan
        const [checkupResult] = await db.query(
            'UPDATE check_up SET id_tagihan = ? WHERE id_pasien = ? AND id_tagihan IS NULL AND status = "selesai"',
            [idTagihan, id]
        );
        console.log('[DOKTER] Checkup updated:', checkupResult.affectedRows, 'rows');

        // ✅ UPDATE semua riwayat_obat yang BELUM punya id_tagihan
        const [obatResult] = await db.query(
            'UPDATE riwayat_obat SET id_tagihan = ? WHERE id_pasien = ? AND id_tagihan IS NULL',
            [idTagihan, id]
        );
        console.log('[DOKTER] Obat updated:', obatResult.affectedRows, 'rows');

        // ✅ UPDATE ruangan yang BELUM punya id_tagihan (jika ada)
        const [ruanganResult] = await db.query(
            'UPDATE ruangan SET id_tagihan = ? WHERE ditempati = ? AND id_tagihan IS NULL AND status = "kosong"',
            [idTagihan, id]
        );
        console.log('[DOKTER] Ruangan updated:', ruanganResult.affectedRows, 'rows');

        // ✅ REKALKULASI total tagihan
        const [totalRincian] = await db.query(`
            SELECT 
                COALESCE((SELECT SUM(biaya_checkup) FROM check_up WHERE id_tagihan = ?), 0) +
                COALESCE((SELECT SUM(total_harga) FROM riwayat_obat WHERE id_tagihan = ?), 0) +
                COALESCE((SELECT SUM(biaya_per_hari * COALESCE(lama_inap, 1)) FROM ruangan WHERE id_tagihan = ?), 0) 
                AS total
        `, [idTagihan, idTagihan, idTagihan]);

        const totalAkhir = parseFloat(totalRincian[0]?.total) || 0;

        await db.query(
            'UPDATE tagihan SET total_biaya = ? WHERE id_tagihan = ?',
            [totalAkhir, idTagihan]
        );

        await db.query(
            'INSERT INTO notifikasi (jenis, pesan, tanggal, dibaca) VALUES (?, ?, NOW(), FALSE)',
            ['pasien_pulang', `Pasien ${pasien[0].nama} (ID: ${id}) telah dipulangkan. Total tagihan: Rp${totalAkhir}`]
        );

        res.json({ 
            message: 'Pasien berhasil dipulangkan!', 
            id_tagihan: idTagihan,
            total_tagihan: totalAkhir,
            checkup_updated: checkupResult.affectedRows,
            obat_updated: obatResult.affectedRows
        });
    } catch (err) {
        console.error('[ERROR] dischargePasien:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== BATALKAN PULANG ====================
const batalkanPulangPasien = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE pasien SET msh_dirawat = "dirawat" WHERE id_pasien = ?', [id]);
        res.json({ message: 'Status pasien dikembalikan ke dirawat' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== ASSIGN RAWAT INAP ====================
const assignRawatInap = async (req, res) => {
    try {
        const { id_pasien, id_ruangan, lama_inap } = req.body;
        
        if (!id_pasien || !id_ruangan) {
            return res.status(400).json({ message: 'Data tidak lengkap' });
        }

        const [pasien] = await db.query(
            'SELECT id_pasien, nama, msh_dirawat FROM pasien WHERE id_pasien = ?',
            [id_pasien]
        );
        if (pasien.length === 0) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }

        const [ruangan] = await db.query(
            'SELECT id_ruangan, nama_ruangan, status, biaya_per_hari FROM ruangan WHERE id_ruangan = ? AND status = "kosong"',
            [id_ruangan]
        );
        if (ruangan.length === 0) {
            return res.status(400).json({ message: 'Ruangan tidak tersedia atau sudah terisi' });
        }

        // ✅ PASTIKAN lama_inap valid
        let lama = parseInt(lama_inap) || 1;
        if (lama < 1) lama = 1;
        
        console.log('[DOKTER] Assign rawat inap:', { id_pasien, id_ruangan, lama });

        // ✅ UPDATE pasien
        await db.query(
            'UPDATE pasien SET msh_dirawat = "dirawat" WHERE id_pasien = ?',
            [id_pasien]
        );

        // ✅ UPDATE ruangan dengan lama_inap
        await db.query(
            `UPDATE ruangan 
             SET status = 'terisi', 
                 ditempati = ?, 
                 tanggal_checkin = NOW(), 
                 lama_inap = ?,
                 biaya_per_hari = ? 
             WHERE id_ruangan = ?`,
            [id_pasien, lama, ruangan[0].biaya_per_hari, id_ruangan]
        );

        // ✅ NOTIFIKASI
        await db.query(
            `INSERT INTO notifikasi (jenis, pesan, tanggal, dibaca) VALUES (?, ?, NOW(), FALSE)`,
            ['rawat_inap', `Pasien ${pasien[0].nama} (ID: ${id_pasien}) dirawat inap di ${ruangan[0].nama_ruangan} selama ${lama} hari`]
        );

        res.json({
            message: 'Pasien berhasil dirawat inap',
            pasien_id: id_pasien,
            ruangan_id: id_ruangan,
            lama_inap: lama,
            biaya_per_hari: ruangan[0].biaya_per_hari
        });
    } catch (err) {
        console.error('[ERROR] assignRawatInap:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== PULANGKAN DARI RUANGAN ====================
const pulangkanDariRuangan = async (req, res) => {
    try {
        const idRuangan = req.params.id;
        const { id_pasien, lama_inap } = req.body;

        if (!id_pasien) {
            return res.status(400).json({ message: 'ID Pasien wajib diisi' });
        }

        const [ruangan] = await db.query(
            'SELECT biaya_per_hari, nama_ruangan, tanggal_checkin FROM ruangan WHERE id_ruangan = ? AND status = "terisi"',
            [idRuangan]
        );
        if (ruangan.length === 0) {
            return res.status(404).json({ message: 'Ruangan tidak ditemukan atau sudah kosong' });
        }

        const biayaAkhir = ruangan[0].biaya_per_hari || 0;
        
        let lama = parseInt(lama_inap);
        if (!lama || lama < 1) {
            if (ruangan[0].tanggal_checkin) {
                const checkin = new Date(ruangan[0].tanggal_checkin);
                const now = new Date();
                lama = Math.max(1, Math.ceil((now - checkin) / (1000 * 60 * 60 * 24)));
            } else {
                lama = 1;
            }
        }
        
        const totalBiayaRawat = biayaAkhir * lama;

        // ✅ UPDATE ruangan menjadi kosong
        await db.query(
            'UPDATE ruangan SET status = "kosong", ditempati = NULL, tanggal_checkin = NULL, lama_inap = NULL WHERE id_ruangan = ?',
            [idRuangan]
        );

        // ✅ UPDATE status pasien
        await db.query(
            'UPDATE pasien SET msh_dirawat = "pulang" WHERE id_pasien = ?',
            [id_pasien]
        );

        // ✅ CEK tagihan existing
        let [existing] = await db.query(
            'SELECT id_tagihan, total_biaya FROM tagihan WHERE id_pasien = ? AND status = "belum"',
            [id_pasien]
        );

        let idTagihan;
        if (existing.length > 0) {
            idTagihan = existing[0].id_tagihan;
            await db.query(
                'UPDATE tagihan SET total_biaya = total_biaya + ? WHERE id_tagihan = ?',
                [totalBiayaRawat, idTagihan]
            );
        } else {
            const [newTagihan] = await db.query(
                `INSERT INTO tagihan (id_pasien, total_biaya, status, tanggal_tagihan, keterangan) 
                 VALUES (?, ?, 'belum', CURDATE(), ?)`,
                [id_pasien, totalBiayaRawat, `Tagihan rawat inap ${lama} hari di ${ruangan[0].nama_ruangan}`]
            );
            idTagihan = newTagihan.insertId;
        }

        // ✅ UPDATE ruangan dengan id_tagihan
        await db.query(
            'UPDATE ruangan SET id_tagihan = ? WHERE id_ruangan = ?',
            [idTagihan, idRuangan]
        );

        // ✅ UPDATE checkup yang BELUM punya id_tagihan
        const [checkupResult] = await db.query(
            'UPDATE check_up SET id_tagihan = ? WHERE id_pasien = ? AND id_tagihan IS NULL AND status = "selesai"',
            [idTagihan, id_pasien]
        );
        console.log('[DOKTER] Checkup updated:', checkupResult.affectedRows, 'rows');

        // ✅ UPDATE riwayat_obat yang BELUM punya id_tagihan
        const [obatResult] = await db.query(
            'UPDATE riwayat_obat SET id_tagihan = ? WHERE id_pasien = ? AND id_tagihan IS NULL',
            [idTagihan, id_pasien]
        );
        console.log('[DOKTER] Obat updated:', obatResult.affectedRows, 'rows');

        // ✅ REKALKULASI total tagihan
        const [totalRincian] = await db.query(`
            SELECT 
                COALESCE((SELECT SUM(biaya_checkup) FROM check_up WHERE id_tagihan = ?), 0) +
                COALESCE((SELECT SUM(total_harga) FROM riwayat_obat WHERE id_tagihan = ?), 0) +
                COALESCE((SELECT SUM(biaya_per_hari * COALESCE(lama_inap, 1)) FROM ruangan WHERE id_tagihan = ?), 0) 
                AS total
        `, [idTagihan, idTagihan, idTagihan]);

        const totalAkhir = parseFloat(totalRincian[0]?.total) || 0;

        await db.query(
            'UPDATE tagihan SET total_biaya = ? WHERE id_tagihan = ?',
            [totalAkhir, idTagihan]
        );

        await db.query(
            `INSERT INTO notifikasi (jenis, pesan, tanggal, dibaca) VALUES (?, ?, NOW(), FALSE)`,
            ['pasien_pulang', 
             `Pasien ID ${id_pasien} telah dipulangkan dari ruangan ${ruangan[0].nama_ruangan}. Total tagihan: Rp${totalAkhir}`
            ]
        );

        res.json({
            message: 'Pasien berhasil dipulangkan dari ruangan',
            id_tagihan: idTagihan,
            lama_inap: lama,
            total_biaya_rawat: totalBiayaRawat,
            total_tagihan: totalAkhir,
            checkup_updated: checkupResult.affectedRows,
            obat_updated: obatResult.affectedRows
        });
    } catch (err) {
        console.error('[ERROR] pulangkanDariRuangan:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== FUNGSI HELP ====================
async function buatTagihanOtomatis(idPasien) {
    const [existing] = await db.query(
        'SELECT id_tagihan FROM tagihan WHERE id_pasien = ? AND status = "belum"',
        [idPasien]
    );
    if (existing.length > 0) {
        await updateTotalTagihan(existing[0].id_tagihan, idPasien);
        return existing[0].id_tagihan;
    }

    const [result] = await db.query(
        'INSERT INTO tagihan (id_pasien, total_biaya, status, tanggal_tagihan, keterangan) VALUES (?, 0, "belum", CURDATE(), ?)',
        [idPasien, `Tagihan otomatis untuk pasien ID ${idPasien}`]
    );
    const idTagihan = result.insertId;

    await db.query(
        'UPDATE check_up SET id_tagihan = ? WHERE id_pasien = ? AND status = "selesai" AND id_tagihan IS NULL',
        [idTagihan, idPasien]
    );
    await db.query(
        'UPDATE riwayat_obat SET id_tagihan = ? WHERE id_pasien = ? AND id_tagihan IS NULL',
        [idTagihan, idPasien]
    );
    await db.query(
        'UPDATE ruangan SET id_tagihan = ? WHERE ditempati = ? AND status = "kosong" AND id_tagihan IS NULL',
        [idTagihan, idPasien]
    );

    await updateTotalTagihan(idTagihan, idPasien);
    return idTagihan;
}

async function updateTotalTagihan(idTagihan, idPasien) {
    const [[{ totalCheckup }]] = await db.query(
        'SELECT COALESCE(SUM(biaya_checkup), 0) as totalCheckup FROM check_up WHERE id_pasien = ? AND id_tagihan = ?',
        [idPasien, idTagihan]
    );
    const [[{ totalObat }]] = await db.query(
        'SELECT COALESCE(SUM(total_harga), 0) as totalObat FROM riwayat_obat WHERE id_pasien = ? AND id_tagihan = ?',
        [idPasien, idTagihan]
    );
    const [[{ totalRawatInap }]] = await db.query(
        'SELECT COALESCE(SUM(biaya_per_hari * lama_inap), 0) as totalRawatInap FROM ruangan WHERE ditempati = ? AND id_tagihan = ? AND status = "kosong"',
        [idPasien, idTagihan]
    );
    const total = parseFloat(totalCheckup) + parseFloat(totalObat) + parseFloat(totalRawatInap);
    await db.query('UPDATE tagihan SET total_biaya = ? WHERE id_tagihan = ?', [total, idTagihan]);
}

// ==================== EXPORT ====================
module.exports = {
    getDashboardDokter,
    getPasienSaya,
    getJadwalSaya,
    updateDeskripsiPasien,
    updateCheckupStatus,
    dischargePasien,
    batalkanPulangPasien,
    assignRawatInap,
    pulangkanDariRuangan
};