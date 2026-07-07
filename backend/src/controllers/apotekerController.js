const db = require('../config/db');

// ==================== GET OBAT ====================
const getObat = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id_obat, nama_obat, stok, batas_notifikasi, tanggal_restok_terakhir, harga FROM stok_obat');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== TAMBAH STOK OBAT ====================
const tambahStokObat = async (req, res) => {
    try {
        const { id } = req.params;
        const { jumlah } = req.body;
        const jumlahInt = parseInt(jumlah);
        if (isNaN(jumlahInt) || jumlahInt <= 0)
            return res.status(400).json({ message: 'Jumlah tidak valid' });
        const [data] = await db.query('SELECT stok FROM stok_obat WHERE id_obat = ?', [id]);
        if (data.length === 0) return res.status(404).json({ message: 'Obat tidak ditemukan' });
        const newQty = data[0].stok + jumlahInt;
        await db.query('UPDATE stok_obat SET stok = ?, tanggal_restok_terakhir = CURDATE() WHERE id_obat = ?', [newQty, id]);
        res.json({ message: 'Stok ditambah', newQty });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== KURANGI STOK OBAT ====================
const kurangiStokObat = async (req, res) => {
    try {
        const { id } = req.params;
        const { jumlah, id_checkup } = req.body;
        const jumlahInt = parseInt(jumlah);
        const idCheckupInt = parseInt(id_checkup);

        if (isNaN(jumlahInt) || jumlahInt <= 0)
            return res.status(400).json({ message: 'Jumlah harus angka positif' });
        if (isNaN(idCheckupInt) || idCheckupInt <= 0)
            return res.status(400).json({ message: 'ID Checkup harus angka positif' });

        const [check] = await db.query('SELECT id_checkup, id_pasien FROM check_up WHERE id_checkup = ?', [idCheckupInt]);
        if (check.length === 0) return res.status(400).json({ message: 'ID Checkup tidak ditemukan' });

        const [data] = await db.query('SELECT stok, nama_obat, harga FROM stok_obat WHERE id_obat = ?', [id]);
        if (data.length === 0) return res.status(404).json({ message: 'Obat tidak ditemukan' });
        if (data[0].stok < jumlahInt) return res.status(400).json({ message: 'Stok tidak mencukupi' });

        const newQty = data[0].stok - jumlahInt;
        await db.query('UPDATE stok_obat SET stok = ? WHERE id_obat = ?', [newQty, id]);

        const totalHargaObat = parseFloat(data[0].harga || 0) * jumlahInt;
        const idPasien = check[0].id_pasien;

        const [riwayatResult] = await db.query(
            'INSERT INTO riwayat_obat (id_checkup, id_pasien, id_obat, jumlah, total_harga) VALUES (?, ?, ?, ?, ?)',
            [idCheckupInt, idPasien, id, jumlahInt, totalHargaObat]
        );

        const [existing] = await db.query('SELECT id_tagihan FROM tagihan WHERE id_pasien = ? AND status = "belum"', [idPasien]);
        if (existing.length > 0) {
            await db.query('UPDATE tagihan SET total_biaya = total_biaya + ? WHERE id_tagihan = ?', [totalHargaObat, existing[0].id_tagihan]);
            await db.query('UPDATE riwayat_obat SET id_tagihan = ? WHERE id_riwayat = ?', [existing[0].id_tagihan, riwayatResult.insertId]);
        } else {
            const [pasien] = await db.query('SELECT msh_dirawat FROM pasien WHERE id_pasien = ?', [idPasien]);
            if (pasien[0]?.msh_dirawat === 'pulang') {
                const [newTagihan] = await db.query(
                    'INSERT INTO tagihan (id_pasien, total_biaya, status, tanggal_tagihan, keterangan) VALUES (?, ?, "belum", CURDATE(), ?)',
                    [idPasien, totalHargaObat, 'Tagihan otomatis dari pembelian obat']
                );
                await db.query('UPDATE riwayat_obat SET id_tagihan = ? WHERE id_riwayat = ?', [newTagihan.insertId, riwayatResult.insertId]);
            }
        }

        await db.query(
            'INSERT INTO notifikasi (jenis, pesan, tanggal, dibaca) VALUES (?, ?, NOW(), FALSE)',
            ['obat_dibeli', `Pasien ID ${idPasien} membeli obat ${data[0].nama_obat} ${jumlahInt} pcs (Total: Rp${totalHargaObat}). Tagihan otomatis diupdate.`]
        );

        res.json({ message: 'Stok dikurangi dan tagihan otomatis diupdate', newQty, total_harga: totalHargaObat });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== BUANG OBAT ====================
const buangObat = async (req, res) => {
    try {
        const { id } = req.params;
        const { jumlah } = req.body;
        const jumlahInt = parseInt(jumlah);
        if (isNaN(jumlahInt) || jumlahInt <= 0) return res.status(400).json({ message: 'Jumlah tidak valid' });
        const [data] = await db.query('SELECT stok, nama_obat FROM stok_obat WHERE id_obat = ?', [id]);
        if (data.length === 0) return res.status(404).json({ message: 'Obat tidak ditemukan' });
        if (data[0].stok < jumlahInt) return res.status(400).json({ message: 'Stok tidak mencukupi' });
        const newQty = data[0].stok - jumlahInt;
        await db.query('UPDATE stok_obat SET stok = ? WHERE id_obat = ?', [newQty, id]);
        await db.query(
            'INSERT INTO notifikasi (jenis, pesan, tanggal, dibaca) VALUES (?, ?, NOW(), FALSE)',
            ['obat_dibuang', `Obat ${data[0].nama_obat} sebanyak ${jumlahInt} telah dibuang.`]
        );
        res.json({ message: 'Obat berhasil dibuang', newQty });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== TAMBAH OBAT BARU ====================
const tambahObatBaru = async (req, res) => {
    try {
        const { nama_obat, stok_awal, batas_notifikasi, harga } = req.body;
        if (!nama_obat) return res.status(400).json({ message: 'Nama obat wajib diisi' });
        const stok = stok_awal ? parseInt(stok_awal) : 0;
        const batas = batas_notifikasi ? parseInt(batas_notifikasi) : 50;
        const hargaObat = harga ? parseFloat(harga) : 0;
        const [result] = await db.query(
            'INSERT INTO stok_obat (nama_obat, stok, batas_notifikasi, tanggal_restok_terakhir, harga) VALUES (?, ?, ?, CURDATE(), ?)',
            [nama_obat, stok, batas, hargaObat]
        );
        res.json({ message: 'Obat berhasil ditambahkan', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET CHECKUP UNTUK APOTEKER ====================
const getCheckupForApoteker = async (req, res) => {
    try {
        const { search } = req.query;
        let query = `
            SELECT c.id_checkup, p.nama AS nama_pasien, p.nama_penyakit AS penyakit,
                   d.nama_dokter, c.tanggal, c.jam, c.status, c.keterangan, c.rekomendasi_obat
            FROM check_up c
            JOIN pasien p ON c.id_pasien = p.id_pasien
            JOIN dokter d ON c.id_dokter = d.id_dokter
            WHERE 1=1
        `;
        let params = [];
        if (search && search.trim() !== '') {
            query += ` AND LOWER(p.nama) LIKE LOWER(?)`;
            params.push(`%${search.trim()}%`);
        }
        query += ` ORDER BY c.tanggal DESC, c.jam DESC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== GET CHECKUP DENGAN REKOMENDASI OBAT ====================
const getCheckupRekomendasi = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.id_checkup, p.id_pasien, p.nama AS nama_pasien, d.nama_dokter,
                   c.tanggal, c.jam, c.keterangan, c.status, c.rekomendasi_obat,
                   (SELECT COUNT(*) FROM riwayat_obat WHERE id_checkup = c.id_checkup) as total_obat_diproses
            FROM check_up c
            JOIN pasien p ON c.id_pasien = p.id_pasien
            JOIN dokter d ON c.id_dokter = d.id_dokter
            WHERE c.status = 'selesai'
              AND (c.rekomendasi_obat IS NOT NULL AND c.rekomendasi_obat != '')
            ORDER BY c.tanggal DESC, c.jam DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==================== EXPORT ====================
module.exports = {
    getObat,
    tambahStokObat,
    kurangiStokObat,
    buangObat,
    tambahObatBaru,
    getCheckupForApoteker,
    getCheckupRekomendasi        // ✅ wajib ada
};