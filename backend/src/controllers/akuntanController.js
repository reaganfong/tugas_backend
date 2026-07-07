const db = require('../config/db');

// ==================== TAGIHAN ====================
const getTagihan = async (req, res) => {
    try {
        const { search, status } = req.query;
        
        let query = `
            SELECT 
                t.id_tagihan, 
                p.nama, 
                t.total_biaya, 
                t.status, 
                t.tanggal_tagihan, 
                t.keterangan,
                -- Rincian untuk verifikasi
                COALESCE((SELECT SUM(c.biaya_checkup) FROM check_up c WHERE c.id_tagihan = t.id_tagihan), 0) AS total_checkup,
                COALESCE((SELECT SUM(ro.total_harga) FROM riwayat_obat ro WHERE ro.id_tagihan = t.id_tagihan), 0) AS total_obat,
                COALESCE((SELECT SUM(r.biaya_per_hari * COALESCE(r.lama_inap, 1)) FROM ruangan r WHERE r.id_tagihan = t.id_tagihan), 0) AS total_rawat_inap
            FROM tagihan t
            JOIN pasien p ON t.id_pasien = p.id_pasien
            WHERE 1=1
        `;
        let params = [];
        
        if (search) {
            query += ` AND t.id_tagihan = ?`;
            params.push(search);
        }
        if (status && (status === 'lunas' || status === 'belum')) {
            query += ` AND t.status = ?`;
            params.push(status);
        }
        query += ` ORDER BY t.status DESC, t.tanggal_tagihan DESC`;
        
        const [rows] = await db.query(query, params);
        
        // ✅ Rekalkulasi ulang untuk memastikan total sesuai
        for (const row of rows) {
            const totalRincian = parseFloat(row.total_checkup || 0) + 
                                 parseFloat(row.total_obat || 0) + 
                                 parseFloat(row.total_rawat_inap || 0);
            
            // Jika tidak sesuai, update
            if (Math.abs(totalRincian - parseFloat(row.total_biaya || 0)) > 100) {
                console.log('[AKUNTAN] Update tagihan #' + row.id_tagihan + ' dari Rp' + row.total_biaya + ' ke Rp' + totalRincian);
                await db.query(
                    'UPDATE tagihan SET total_biaya = ? WHERE id_tagihan = ?',
                    [totalRincian, row.id_tagihan]
                );
                row.total_biaya = totalRincian;
            }
        }
        
        res.json(rows);
    } catch (err) {
        console.error('[ERROR] getTagihan:', err);
        res.status(500).json({ message: err.message });
    }
};

// ===== UPDATE STATUS TAGIHAN (MANUAL DARI AKUNTAN) =====
const updateTagihanStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;
        
        if (!status || (status !== 'lunas' && status !== 'belum')) {
            return res.status(400).json({ message: 'Status harus "lunas" atau "belum"' });
        }
        
        // ✅ Rekalkulasi total sebelum update status
        const [totalRincian] = await db.query(`
            SELECT 
                COALESCE((SELECT SUM(biaya_checkup) FROM check_up WHERE id_tagihan = ?), 0) +
                COALESCE((SELECT SUM(total_harga) FROM riwayat_obat WHERE id_tagihan = ?), 0) +
                COALESCE((SELECT SUM(biaya_per_hari * COALESCE(lama_inap, 1)) FROM ruangan WHERE id_tagihan = ?), 0) 
                AS total
        `, [id, id, id]);
        
        const totalAkhir = parseFloat(totalRincian[0]?.total) || 0;
        
        await db.query(
            'UPDATE tagihan SET status = ?, total_biaya = ? WHERE id_tagihan = ?',
            [status, totalAkhir, id]
        );
        
        const [result] = await db.query(
            'SELECT id_tagihan FROM tagihan WHERE id_tagihan = ?',
            [id]
        );
        
        if (result.length === 0) {
            return res.status(404).json({ message: 'Tagihan tidak ditemukan' });
        }
        
        res.json({ 
            message: 'Status tagihan berhasil diubah',
            total_biaya: totalAkhir
        });
    } catch (err) {
        console.error('[ERROR] updateTagihanStatus:', err);
        res.status(500).json({ message: err.message });
    }
};

// ===== BATALKAN LUNAS =====
const batalkanLunas = async (req, res) => {
    try {
        const id = Number(req.params.id);
        
        const [result] = await db.query('UPDATE tagihan SET status = "belum" WHERE id_tagihan = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tagihan tidak ditemukan' });
        }
        res.json({ message: 'Status tagihan dikembalikan ke belum lunas' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ===== TAMBAH TAGIHAN BARU =====
const addTagihan = async (req, res) => {
    try {
        const { id_pasien, total_biaya, keterangan } = req.body;
        
        if (!id_pasien || !total_biaya) {
            return res.status(400).json({ message: 'ID Pasien dan Total Biaya wajib diisi' });
        }
        
        const [result] = await db.query(
            `INSERT INTO tagihan (id_pasien, total_biaya, status, tanggal_tagihan, keterangan) 
             VALUES (?, ?, 'belum', CURDATE(), ?)`,
            [id_pasien, total_biaya, keterangan || '']
        );
        
        res.json({ 
            message: 'Tagihan berhasil ditambahkan', 
            id_tagihan: result.insertId 
        });
    } catch (err) {
        console.error('[ERROR] addTagihan:', err);
        res.status(500).json({ message: err.message });
    }
};

// ==================== FASILITAS ====================
const getFasilitas = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM fasilitas');
        const rusak = rows.filter(f => f.status === 'rusak');
        res.json({
            fasilitas: rows,
            notifikasi_rusak: rusak
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const toggleFasilitasStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [fasilitas] = await db.query('SELECT status, nama_fasilitas FROM fasilitas WHERE id_fasilitas = ?', [id]);
        if (fasilitas.length === 0) {
            return res.status(404).json({ message: 'Fasilitas tidak ditemukan' });
        }
        
        const newStatus = fasilitas[0].status === 'baik' ? 'rusak' : 'baik';
        await db.query('UPDATE fasilitas SET status = ? WHERE id_fasilitas = ?', [newStatus, id]);
        
        if (newStatus === 'rusak') {
            await db.query(
                'INSERT INTO notifikasi (jenis, pesan, tanggal, dibaca) VALUES (?, ?, NOW(), FALSE)',
                ['fasilitas_rusak', `Fasilitas ${fasilitas[0].nama_fasilitas} berstatus rusak. Perlu perbaikan.`]
            );
        }
        
        res.json({ message: 'Status fasilitas berhasil diubah', status: newStatus });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== CHECK-IN / CHECK-OUT ====================
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
        const formatted = rows.map(row => ({
            ...row,
            jam_tanggal_checkin: row.tanggal && row.jam ? `${row.tanggal}T${row.jam}` : null,
            jam_tanggal_checkout: row.checkout || null
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== DETAIL TAGIHAN ====================
const getDetailTagihan = async (req, res) => {
    try {
        const idTagihan = Number(req.params.id);
        
        const [tagihanRows] = await db.query(`
            SELECT t.*, p.id_pasien, p.nama AS nama_pasien, p.no_telp_pasien
            FROM tagihan t
            JOIN pasien p ON t.id_pasien = p.id_pasien
            WHERE t.id_tagihan = ?
        `, [idTagihan]);
        
        if (tagihanRows.length === 0) {
            return res.status(404).json({ message: 'Tagihan tidak ditemukan' });
        }
        
        const tagihan = tagihanRows[0];
        const idPasien = tagihan.id_pasien;
        
        // ===== CHECKUP =====
        const [checkupRows] = await db.query(`
            SELECT 
                c.id_checkup,
                c.tanggal,
                c.jam,
                c.biaya_checkup,
                d.nama_dokter,
                c.keterangan
            FROM check_up c
            LEFT JOIN dokter d ON c.id_dokter = d.id_dokter
            WHERE c.id_pasien = ? AND c.id_tagihan = ?
            ORDER BY c.tanggal DESC, c.jam DESC
        `, [idPasien, idTagihan]);

        // ===== OBAT =====
        const [obatRows] = await db.query(`
            SELECT 
                r.id_riwayat,
                s.nama_obat,
                s.harga,
                r.jumlah,
                r.total_harga
            FROM riwayat_obat r
            JOIN stok_obat s ON r.id_obat = s.id_obat
            WHERE r.id_pasien = ? AND r.id_tagihan = ?
            ORDER BY r.tanggal DESC
        `, [idPasien, idTagihan]);
        
        // ===== RAWAT INAP =====
        const [ruanganRows] = await db.query(`
            SELECT 
                r.id_ruangan,
                r.nama_ruangan,
                r.nomor_ruangan,
                r.biaya_per_hari,
                COALESCE(r.lama_inap, 1) AS lama_inap,
                r.tanggal_checkin,
                (r.biaya_per_hari * COALESCE(r.lama_inap, 1)) AS total_biaya_ruangan
            FROM ruangan r
            WHERE r.id_tagihan = ?
        `, [idTagihan]);
        
        // ===== HITUNG TOTAL =====
        let totalDariCheckup = 0;
        let totalDariObat = 0;
        let totalDariRuangan = 0;
        
        checkupRows.forEach(function(c) {
            totalDariCheckup += parseFloat(c.biaya_checkup || 0);
        });
        
        ruanganRows.forEach(function(r) {
            const total = parseFloat(r.total_biaya_ruangan || 0);
            totalDariRuangan += total;
            console.log('[DETAIL] Ruangan:', r.nama_ruangan, 'lama:', r.lama_inap, 'biaya:', r.biaya_per_hari, 'total:', total);
        });

        obatRows.forEach(function(o) {
            totalDariObat += parseFloat(o.total_harga || 0);
        });
        
        const totalRincian = totalDariCheckup + totalDariObat + totalDariRuangan;
        
        console.log('[DETAIL] Total rincian:', {
            checkup: totalDariCheckup,
            obat: totalDariObat,
            rawat_inap: totalDariRuangan,
            total: totalRincian
        });
        
        // ✅ Jika total tidak sesuai, update tagihan
        const currentTotal = parseFloat(tagihan.total_biaya) || 0;
        if (Math.abs(totalRincian - currentTotal) > 100) {
            console.log('[AKUNTAN] Total tidak sesuai, update tagihan:', {
                old: currentTotal,
                new: totalRincian
            });
            await db.query(
                'UPDATE tagihan SET total_biaya = ? WHERE id_tagihan = ?',
                [totalRincian, idTagihan]
            );
            tagihan.total_biaya = totalRincian;
        }
        
        res.json({
            tagihan: {
                id_tagihan: tagihan.id_tagihan,
                id_pasien: tagihan.id_pasien,
                nama: tagihan.nama_pasien,
                total_biaya: parseFloat(tagihan.total_biaya),
                status: tagihan.status,
                tanggal_tagihan: tagihan.tanggal_tagihan,
                keterangan: tagihan.keterangan
            },
            rincian: {
                checkup: {
                    total: totalDariCheckup,
                    items: checkupRows
                },
                obat: {
                    total: totalDariObat,
                    items: obatRows
                },
                rawat_inap: {
                    total: totalDariRuangan,
                    items: ruanganRows
                }
            },
            total_rincian: totalRincian
        });
        
    } catch (err) {
        console.error('[ERROR] getDetailTagihan:', err);
        res.status(500).json({ message: err.message });
    }
};
// ==================== EXPORT ====================
module.exports = {
    getTagihan,
    getFasilitas,
    getPasienCheckInOut,
    updateTagihanStatus,
    batalkanLunas,
    toggleFasilitasStatus,
    getDetailTagihan,
    addTagihan
};