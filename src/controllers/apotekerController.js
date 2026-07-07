const prisma = require('../config/prisma');
const { handleError } = require('../utils/handleError');

// ==================== GET OBAT ====================
const getObat = async (req, res) => {
    try {
        const rows = await prisma.stokObat.findMany({
            select: {
                id: true,
                nama_obat: true,
                stok: true,
                batas_notifikasi: true,
                tanggal_restok_terakhir: true,
                harga: true
            }
        });

        // Map id → id_obat for API consistency
        const result = rows.map(r => ({
            id_obat: r.id,
            nama_obat: r.nama_obat,
            stok: r.stok,
            batas_notifikasi: r.batas_notifikasi,
            tanggal_restok_terakhir: r.tanggal_restok_terakhir,
            harga: r.harga
        }));

        res.json(result);
    } catch (err) {
        handleError(res, err);
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

        const obat = await prisma.stokObat.findUnique({ where: { id } });
        if (!obat) return res.status(404).json({ message: 'Obat tidak ditemukan' });

        const newQty = obat.stok + jumlahInt;
        await prisma.stokObat.update({
            where: { id },
            data: {
                stok: newQty,
                tanggal_restok_terakhir: new Date().toISOString().split('T')[0]
            }
        });

        res.json({ message: 'Stok ditambah', newQty });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== KURANGI STOK OBAT ====================
const kurangiStokObat = async (req, res) => {
    try {
        const { id } = req.params;
        const { jumlah, id_checkup } = req.body;
        const jumlahInt = parseInt(jumlah);
        const idCheckupStr = id_checkup;

        if (isNaN(jumlahInt) || jumlahInt <= 0)
            return res.status(400).json({ message: 'Jumlah harus angka positif' });
        if (!idCheckupStr)
            return res.status(400).json({ message: 'ID Checkup diperlukan' });

        const check = await prisma.checkUp.findUnique({ where: { id: idCheckupStr } });
        if (!check) return res.status(400).json({ message: 'ID Checkup tidak ditemukan' });

        const obat = await prisma.stokObat.findUnique({ where: { id } });
        if (!obat) return res.status(404).json({ message: 'Obat tidak ditemukan' });
        if (obat.stok < jumlahInt) return res.status(400).json({ message: 'Stok tidak mencukupi' });

        const newQty = obat.stok - jumlahInt;
        const totalHargaObat = parseFloat(obat.harga || 0) * jumlahInt;
        const idPasien = check.id_pasien;

        // Gunakan transaction untuk mengupdate multiple entities
        await prisma.$transaction(async (tx) => {
            // Update stok
            await tx.stokObat.update({
                where: { id },
                data: { stok: newQty }
            });

            // Insert riwayat obat
            const riwayat = await tx.riwayatObat.create({
                data: {
                    id_checkup: idCheckupStr,
                    id_pasien: idPasien,
                    id_obat: id,
                    jumlah: jumlahInt,
                    total_harga: totalHargaObat
                }
            });

            // Cek tagihan existing
            const existingTagihan = await tx.tagihan.findFirst({
                where: { id_pasien: idPasien, status: 'belum' }
            });

            if (existingTagihan) {
                await tx.tagihan.update({
                    where: { id: existingTagihan.id },
                    data: { total_biaya: { increment: totalHargaObat } }
                });
                await tx.riwayatObat.update({
                    where: { id: riwayat.id },
                    data: { id_tagihan: existingTagihan.id }
                });
            } else {
                const pasien = await tx.pasien.findUnique({ where: { id: idPasien } });
                if (pasien?.msh_dirawat === 'pulang') {
                    const newTagihan = await tx.tagihan.create({
                        data: {
                            id_pasien: idPasien,
                            total_biaya: totalHargaObat,
                            status: 'belum',
                            tanggal_tagihan: new Date().toISOString().split('T')[0],
                            keterangan: 'Tagihan otomatis dari pembelian obat'
                        }
                    });
                    await tx.riwayatObat.update({
                        where: { id: riwayat.id },
                        data: { id_tagihan: newTagihan.id }
                    });
                }
            }

            // Buat notifikasi
            await tx.notifikasi.create({
                data: {
                    jenis: 'obat_dibeli',
                    pesan: `Pasien ID ${idPasien} membeli obat ${obat.nama_obat} ${jumlahInt} pcs (Total: Rp${totalHargaObat}). Tagihan otomatis diupdate.`,
                    tanggal: new Date().toISOString(),
                    dibaca: false
                }
            });
        });

        res.json({ message: 'Stok dikurangi dan tagihan otomatis diupdate', newQty, total_harga: totalHargaObat });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== BUANG OBAT ====================
const buangObat = async (req, res) => {
    try {
        const { id } = req.params;
        const { jumlah } = req.body;
        const jumlahInt = parseInt(jumlah);
        if (isNaN(jumlahInt) || jumlahInt <= 0) return res.status(400).json({ message: 'Jumlah tidak valid' });

        const obat = await prisma.stokObat.findUnique({ where: { id } });
        if (!obat) return res.status(404).json({ message: 'Obat tidak ditemukan' });
        if (obat.stok < jumlahInt) return res.status(400).json({ message: 'Stok tidak mencukupi' });

        const newQty = obat.stok - jumlahInt;
        await prisma.stokObat.update({
            where: { id },
            data: { stok: newQty }
        });

        await prisma.notifikasi.create({
            data: {
                jenis: 'obat_dibuang',
                pesan: `Obat ${obat.nama_obat} sebanyak ${jumlahInt} telah dibuang.`,
                tanggal: new Date().toISOString(),
                dibaca: false
            }
        });

        res.json({ message: 'Obat berhasil dibuang', newQty });
    } catch (err) {
        handleError(res, err);
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

        const result = await prisma.stokObat.create({
            data: {
                nama_obat,
                stok,
                batas_notifikasi: batas,
                tanggal_restok_terakhir: new Date().toISOString().split('T')[0],
                harga: hargaObat
            }
        });

        res.json({ message: 'Obat berhasil ditambahkan', id: result.id });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET CHECKUP UNTUK APOTEKER ====================
const getCheckupForApoteker = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {
            status: { not: undefined } // akan dioverride
        };
        delete where.status;

        // Build where clause
        const whereClause = {};
        if (search && search.trim() !== '') {
            whereClause.pasien = {
                nama: { contains: search.trim(), mode: 'insensitive' }
            };
        }

        const rows = await prisma.checkUp.findMany({
            where: whereClause,
            include: {
                pasien: { select: { nama: true, nama_penyakit: true } },
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
            penyakit: c.pasien?.nama_penyakit || null,
            nama_dokter: c.dokter?.nama_dokter || '-',
            tanggal: c.tanggal,
            jam: c.jam,
            status: c.status,
            keterangan: c.keterangan,
            rekomendasi_obat: c.rekomendasi_obat
        }));

        res.json(result);
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET CHECKUP DENGAN REKOMENDASI OBAT ====================
const getCheckupRekomendasi = async (req, res) => {
    try {
        const rows = await prisma.checkUp.findMany({
            where: {
                status: 'selesai',
                rekomendasi_obat: { not: null, notIn: [''] }
            },
            include: {
                pasien: { select: { id: true, nama: true } },
                dokter: { select: { nama_dokter: true } },
                _count: { select: { riwayat_obat: true } }
            },
            orderBy: [
                { tanggal: 'desc' },
                { jam: 'desc' }
            ]
        });

        const result = rows.map(c => ({
            id_checkup: c.id,
            id_pasien: c.pasien?.id,
            nama_pasien: c.pasien?.nama || '-',
            nama_dokter: c.dokter?.nama_dokter || '-',
            tanggal: c.tanggal,
            jam: c.jam,
            keterangan: c.keterangan,
            status: c.status,
            rekomendasi_obat: c.rekomendasi_obat,
            total_obat_diproses: c._count.riwayat_obat
        }));

        res.json(result);
    } catch (err) {
        handleError(res, err);
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
    getCheckupRekomendasi
};
