const db = require('../config/db');

// Get profil pasien dr ID
// Get profil pasien dr ID
const getProfilById = async (req, res) => {
    const pasienId = req.params.id;

    if (!pasienId) {
        return res.status(400).json({ message: 'ID pasien diperlukan' });
    }

    try {
        const [pasienRows] = await db.query(`
            SELECT p.* 
            FROM pasien p
            WHERE p.id_pasien = ?
        `, [pasienId]);

        if (pasienRows.length === 0) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }

        const pasien = pasienRows[0];

        // Ambil data dokter yang menangani
        const [dokterRows] = await db.query(`
            SELECT DISTINCT d.id_dokter, d.nama_dokter, d.spesialisasi
            FROM check_up c
            JOIN dokter d ON c.id_dokter = d.id_dokter
            WHERE c.id_pasien = ?
            LIMIT 1
        `, [pasienId]);

        // Ambil riwayat checkup dengan format yang benar
        const [riwayatRows] = await db.query(`
            SELECT 
                c.id_checkup, 
                c.jam, 
                c.tanggal, 
                c.checkout, 
                c.keterangan, 
                c.biaya_checkup,
                d.nama_dokter,
                c.status,
                -- ✅ Format check-in yang benar
                CONCAT(
                    DATE_FORMAT(c.tanggal, '%d %M %Y'), 
                    ' pukul ', 
                    TIME_FORMAT(c.jam, '%H.%i')
                ) AS checkin_formatted
            FROM check_up c
            LEFT JOIN dokter d ON c.id_dokter = d.id_dokter
            WHERE c.id_pasien = ?
            ORDER BY c.tanggal DESC, c.jam DESC
        `, [pasienId]);

        // ✅ Format checkout dengan benar
        const riwayatFormatted = riwayatRows.map(row => ({
            ...row,
            checkout_formatted: row.checkout ? 
                new Date(row.checkout).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : '-'
        }));

        // Ambil tagihan terakhir dengan rincian lengkap
        const [tagihanRows] = await db.query(`
            SELECT 
                t.id_tagihan, 
                t.total_biaya, 
                t.status, 
                t.tanggal_tagihan,
                t.keterangan,
                -- Rincian
                COALESCE((SELECT SUM(c.biaya_checkup) FROM check_up c WHERE c.id_tagihan = t.id_tagihan), 0) AS total_checkup,
                COALESCE((SELECT SUM(ro.total_harga) FROM riwayat_obat ro WHERE ro.id_tagihan = t.id_tagihan), 0) AS total_obat,
                COALESCE((SELECT SUM(r.biaya_per_hari * COALESCE(r.lama_inap, 1)) FROM ruangan r WHERE r.id_tagihan = t.id_tagihan), 0) AS total_rawat_inap
            FROM tagihan t
            WHERE t.id_pasien = ?
            ORDER BY t.tanggal_tagihan DESC
            LIMIT 1
        `, [pasienId]);

        // ✅ Rekalkulasi total tagihan
        if (tagihanRows.length > 0) {
            const tagihan = tagihanRows[0];
            const totalRincian = parseFloat(tagihan.total_checkup || 0) + 
                                 parseFloat(tagihan.total_obat || 0) + 
                                 parseFloat(tagihan.total_rawat_inap || 0);
            
            // Update jika tidak sesuai
            if (Math.abs(totalRincian - parseFloat(tagihan.total_biaya || 0)) > 100) {
                await db.query(
                    'UPDATE tagihan SET total_biaya = ? WHERE id_tagihan = ?',
                    [totalRincian, tagihan.id_tagihan]
                );
                tagihan.total_biaya = totalRincian;
            }
        }

        res.json({
            pasien: pasien,
            dokter: dokterRows[0] || null,
            riwayat: riwayatFormatted,
            tagihan: tagihanRows[0] || null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// Search pasien dr ID atau nama
// Search pasien dr ID atau nama
const searchPasien = async (req, res) => {
    const { id, nama } = req.query;

    try {
        let query = `
            SELECT 
                p.*
            FROM pasien p
            WHERE 1=1
        `;
        let params = [];

        if (id) {
            query += ` AND p.id_pasien = ?`;
            params.push(id);
        } else if (nama) {
            query += ` AND p.nama LIKE ?`;
            params.push(`%${nama}%`);
        } else {
            return res.status(400).json({ message: 'Parameter id atau nama diperlukan' });
        }

        const [pasienRows] = await db.query(query, params);

        if (pasienRows.length === 0) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }

        const pasien = pasienRows[0];

        // Ambil dokter yang menangani
        const [dokterRows] = await db.query(`
            SELECT DISTINCT d.id_dokter, d.nama_dokter, d.spesialisasi
            FROM check_up c
            JOIN dokter d ON c.id_dokter = d.id_dokter
            WHERE c.id_pasien = ?
            LIMIT 1
        `, [pasien.id_pasien]);

        // Ambil riwayat checkup dengan format yang benar
        const [riwayatRows] = await db.query(`
            SELECT 
                c.id_checkup, 
                c.jam, 
                c.tanggal, 
                c.checkout, 
                c.keterangan, 
                c.biaya_checkup,
                d.nama_dokter,
                c.status,
                CONCAT(
                    DATE_FORMAT(c.tanggal, '%d %M %Y'), 
                    ' pukul ', 
                    TIME_FORMAT(c.jam, '%H.%i')
                ) AS checkin_formatted
            FROM check_up c
            LEFT JOIN dokter d ON c.id_dokter = d.id_dokter
            WHERE c.id_pasien = ?
            ORDER BY c.tanggal DESC, c.jam DESC
        `, [pasien.id_pasien]);

        const riwayatFormatted = riwayatRows.map(row => ({
            ...row,
            checkout_formatted: row.checkout ? 
                new Date(row.checkout).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : '-'
        }));

        // Ambil tagihan dengan rincian
        const [tagihanRows] = await db.query(`
            SELECT 
                t.id_tagihan, 
                t.total_biaya, 
                t.status, 
                t.tanggal_tagihan,
                t.keterangan,
                COALESCE((SELECT SUM(c.biaya_checkup) FROM check_up c WHERE c.id_tagihan = t.id_tagihan), 0) AS total_checkup,
                COALESCE((SELECT SUM(ro.total_harga) FROM riwayat_obat ro WHERE ro.id_tagihan = t.id_tagihan), 0) AS total_obat,
                COALESCE((SELECT SUM(r.biaya_per_hari * COALESCE(r.lama_inap, 1)) FROM ruangan r WHERE r.id_tagihan = t.id_tagihan), 0) AS total_rawat_inap
            FROM tagihan t
            WHERE t.id_pasien = ?
            ORDER BY t.tanggal_tagihan DESC
            LIMIT 1
        `, [pasien.id_pasien]);

        // Rekalkulasi total tagihan
        if (tagihanRows.length > 0) {
            const tagihan = tagihanRows[0];
            const totalRincian = parseFloat(tagihan.total_checkup || 0) + 
                                 parseFloat(tagihan.total_obat || 0) + 
                                 parseFloat(tagihan.total_rawat_inap || 0);
            
            if (Math.abs(totalRincian - parseFloat(tagihan.total_biaya || 0)) > 100) {
                await db.query(
                    'UPDATE tagihan SET total_biaya = ? WHERE id_tagihan = ?',
                    [totalRincian, tagihan.id_tagihan]
                );
                tagihan.total_biaya = totalRincian;
            }
        }

        res.json({
            pasien: pasien,
            dokter: dokterRows[0] || null,
            riwayat: riwayatFormatted,
            tagihan: tagihanRows[0] || null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = { 
    getProfilById, 
    searchPasien 
};