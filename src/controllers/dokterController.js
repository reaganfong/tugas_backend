const prisma = require('../config/prisma');
const { handleError } = require('../utils/handleError');

// ==================== DASHBOARD DOKTER ====================
const getDashboardDokter = async (req, res) => {
    const dokterId = req.user?.profileId;
    try {
        const totalPasien = await prisma.checkUp.count({
            where: { id_dokter: dokterId }
        });

        const today = new Date().toISOString().split('T')[0];
        const pasienHariIni = await prisma.checkUp.count({
            where: {
                id_dokter: dokterId,
                tanggal: today
            }
        });

        res.json({ totalPasien, pasienHariIni });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET JADWAL SAYA ====================
const getJadwalSaya = async (req, res) => {
    const dokterId = req.user?.profileId;
    try {
        const rows = await prisma.checkUp.findMany({
            where: { id_dokter: dokterId },
            include: {
                pasien: { select: { nama: true } }
            },
            orderBy: [
                { tanggal: 'desc' },
                { jam: 'desc' }
            ]
        });

        const result = rows.map(c => ({
            id_checkup: c.id,
            id_pasien: c.id_pasien,
            nama_pasien: c.pasien?.nama || '-',
            jam: c.jam,
            tanggal: c.tanggal,
            biaya_checkup: c.biaya_checkup,
            checkout: c.checkout,
            status: c.status,
            keterangan: c.keterangan
        }));

        res.json(result);
    } catch (err) {
        console.error('[BACKEND] Error getJadwalSaya:', err);
        handleError(res, err);
    }
};

// ==================== UPDATE DESKRIPSI PASIEN ====================
const updateDeskripsiPasien = async (req, res) => {
    const { id } = req.params;
    const { deskripsi } = req.body;
    try {
        await prisma.pasien.update({
            where: { id },
            data: { deskripsi_dokter: deskripsi }
        });
        res.json({ message: "OK" });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== UPDATE CHECKUP STATUS (SELESAI) ====================
const updateCheckupStatus = async (req, res) => {
    const { id } = req.params;
    const { diagnosis, rekomendasi_obat } = req.body;
    const dokterId = req.user?.profileId;
    try {
        const check = await prisma.checkUp.findFirst({
            where: {
                id: id,
                id_dokter: dokterId
            }
        });

        if (!check) return res.status(404).json({ message: 'Checkup tidak ditemukan' });

        const idPasien = check.id_pasien;

        // Build update data
        const updateData = {
            status: 'selesai',
            checkout: new Date().toISOString()
        };

        if (diagnosis && diagnosis.trim() !== '') {
            updateData.keterangan = diagnosis;
        }
        if (rekomendasi_obat && rekomendasi_obat.trim() !== '') {
            updateData.rekomendasi_obat = rekomendasi_obat;
        }

        await prisma.checkUp.update({
            where: { id },
            data: updateData
        });

        if (diagnosis && diagnosis.trim() !== '') {
            await prisma.pasien.update({
                where: { id: idPasien },
                data: { deskripsi_dokter: diagnosis }
            });
        }

        res.json({ message: 'Status checkup diubah menjadi selesai' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== GET PASIEN SAYA ====================
const getPasienSaya = async (req, res) => {
    const dokterId = req.user?.profileId;
    const search = req.query.search || '';
    try {
        const rows = await prisma.checkUp.findMany({
            where: {
                id_dokter: dokterId,
                pasien: {
                    nama: { contains: search, mode: 'insensitive' }
                }
            },
            include: {
                pasien: {
                    select: {
                        id: true,
                        nama: true,
                        umur: true,
                        jenis_kelamin: true,
                        nama_penyakit: true,
                        deskripsi_dokter: true,
                        msh_dirawat: true
                    }
                }
            },
            orderBy: { pasien: { nama: 'asc' } }
        });

        // Group by pasien (ambil data terakhir)
        const pasienMap = new Map();
        for (const row of rows) {
            if (!pasienMap.has(row.id_pasien) && row.pasien) {
                pasienMap.set(row.id_pasien, {
                    id_pasien: row.pasien.id,
                    nama: row.pasien.nama,
                    umur: row.pasien.umur,
                    jenis_kelamin: row.pasien.jenis_kelamin,
                    nama_penyakit: row.pasien.nama_penyakit,
                    deskripsi_dokter: row.pasien.deskripsi_dokter,
                    msh_dirawat: row.pasien.msh_dirawat,
                    jam: row.jam,
                    tanggal: row.tanggal
                });
            } else if (row.pasien) {
                const existing = pasienMap.get(row.id_pasien);
                // Keep the most recent date/time
                if (row.tanggal > existing.tanggal || (row.tanggal === existing.tanggal && row.jam > existing.jam)) {
                    existing.jam = row.jam;
                    existing.tanggal = row.tanggal;
                }
            }
        }

        res.json(Array.from(pasienMap.values()));
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== DISCHARGE PASIEN ====================
const dischargePasien = async (req, res) => {
    const { id } = req.params;
    try {
        const pasien = await prisma.pasien.findUnique({ where: { id } });
        if (!pasien) return res.status(404).json({ message: 'Pasien tidak ditemukan' });

        const ruanganTerisi = await prisma.ruangan.count({
            where: { ditempati: id, status: 'terisi' }
        });

        if (ruanganTerisi > 0) {
            return res.status(400).json({ message: 'Pasien masih rawat inap! Pulangkan dari ruangan terlebih dahulu.' });
        }

        // Gunakan transaction
        const result = await prisma.$transaction(async (tx) => {
            // UPDATE status pasien
            await tx.pasien.update({
                where: { id },
                data: { msh_dirawat: 'pulang' }
            });

            // CEK tagihan existing
            let tagihan = await tx.tagihan.findFirst({
                where: { id_pasien: id, status: 'belum' }
            });

            let idTagihan;
            if (tagihan) {
                idTagihan = tagihan.id;
            } else {
                // BUAT tagihan baru
                const newTagihan = await tx.tagihan.create({
                    data: {
                        id_pasien: id,
                        total_biaya: 0,
                        status: 'belum',
                        tanggal_tagihan: new Date().toISOString().split('T')[0],
                        keterangan: `Tagihan otomatis untuk pasien ID ${id}`
                    }
                });
                idTagihan = newTagihan.id;
            }

            // UPDATE semua checkup yang BELUM punya id_tagihan
            const checkupResult = await tx.checkUp.updateMany({
                where: { id_pasien: id, id_tagihan: null, status: 'selesai' },
                data: { id_tagihan: idTagihan }
            });

            // UPDATE semua riwayat_obat yang BELUM punya id_tagihan
            const obatResult = await tx.riwayatObat.updateMany({
                where: { id_pasien: id, id_tagihan: null },
                data: { id_tagihan: idTagihan }
            });

            // REKALKULASI total tagihan
            const total = await hitungTotalTagihan(tx, idTagihan);
            await tx.tagihan.update({
                where: { id: idTagihan },
                data: { total_biaya: total }
            });

            // NOTIFIKASI
            await tx.notifikasi.create({
                data: {
                    jenis: 'pasien_pulang',
                    pesan: `Pasien ${pasien.nama} (ID: ${id}) telah dipulangkan. Total tagihan: Rp${total}`,
                    tanggal: new Date().toISOString(),
                    dibaca: false
                }
            });

            return {
                idTagihan,
                totalAkhir: total,
                checkupUpdated: checkupResult.count,
                obatUpdated: obatResult.count
            };
        });

        res.json({
            message: 'Pasien berhasil dipulangkan!',
            id_tagihan: result.idTagihan,
            total_tagihan: result.totalAkhir,
            checkup_updated: result.checkupUpdated,
            obat_updated: result.obatUpdated
        });
    } catch (err) {
        console.error('[ERROR] dischargePasien:', err);
        handleError(res, err);
    }
};

// ==================== BATALKAN PULANG ====================
const batalkanPulangPasien = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.pasien.update({
            where: { id },
            data: { msh_dirawat: 'dirawat' }
        });
        res.json({ message: 'Status pasien dikembalikan ke dirawat' });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== ASSIGN RAWAT INAP ====================
const assignRawatInap = async (req, res) => {
    try {
        const { id_pasien, id_ruangan, lama_inap } = req.body;

        if (!id_pasien || !id_ruangan) {
            return res.status(400).json({ message: 'Data tidak lengkap' });
        }

        const pasien = await prisma.pasien.findUnique({ where: { id: id_pasien } });
        if (!pasien) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }

        const ruangan = await prisma.ruangan.findFirst({
            where: { id: id_ruangan, status: 'kosong' }
        });

        if (!ruangan) {
            return res.status(400).json({ message: 'Ruangan tidak tersedia atau sudah terisi' });
        }

        let lama = parseInt(lama_inap) || 1;
        if (lama < 1) lama = 1;

        console.log('[DOKTER] Assign rawat inap:', { id_pasien, id_ruangan, lama });

        await prisma.$transaction(async (tx) => {
            await tx.pasien.update({
                where: { id: id_pasien },
                data: { msh_dirawat: 'dirawat' }
            });

            await tx.ruangan.update({
                where: { id: id_ruangan },
                data: {
                    status: 'terisi',
                    ditempati: id_pasien,
                    tanggal_checkin: new Date().toISOString(),
                    lama_inap: lama,
                    biaya_per_hari: ruangan.biaya_per_hari
                }
            });

            await tx.notifikasi.create({
                data: {
                    jenis: 'rawat_inap',
                    pesan: `Pasien ${pasien.nama} (ID: ${id_pasien}) dirawat inap di ${ruangan.nama_ruangan} selama ${lama} hari`,
                    tanggal: new Date().toISOString(),
                    dibaca: false
                }
            });
        });

        res.json({
            message: 'Pasien berhasil dirawat inap',
            pasien_id: id_pasien,
            ruangan_id: id_ruangan,
            lama_inap: lama,
            biaya_per_hari: ruangan.biaya_per_hari
        });
    } catch (err) {
        console.error('[ERROR] assignRawatInap:', err);
        handleError(res, err);
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

        const ruangan = await prisma.ruangan.findFirst({
            where: { id: idRuangan, status: 'terisi' }
        });

        if (!ruangan) {
            return res.status(404).json({ message: 'Ruangan tidak ditemukan atau sudah kosong' });
        }

        const biayaAkhir = ruangan.biaya_per_hari || 0;

        let lama = parseInt(lama_inap);
        if (!lama || lama < 1) {
            if (ruangan.tanggal_checkin) {
                const checkin = new Date(ruangan.tanggal_checkin);
                const now = new Date();
                lama = Math.max(1, Math.ceil((now - checkin) / (1000 * 60 * 60 * 24)));
            } else {
                lama = 1;
            }
        }

        const totalBiayaRawat = biayaAkhir * lama;

        const result = await prisma.$transaction(async (tx) => {
            // UPDATE ruangan menjadi kosong
            await tx.ruangan.update({
                where: { id: idRuangan },
                data: {
                    status: 'kosong',
                    ditempati: null,
                    tanggal_checkin: null,
                    lama_inap: null
                }
            });

            // UPDATE status pasien
            await tx.pasien.update({
                where: { id: id_pasien },
                data: { msh_dirawat: 'pulang' }
            });

            // CEK tagihan existing
            let tagihan = await tx.tagihan.findFirst({
                where: { id_pasien: id_pasien, status: 'belum' }
            });

            let idTagihan;
            if (tagihan) {
                idTagihan = tagihan.id;
                await tx.tagihan.update({
                    where: { id: idTagihan },
                    data: { total_biaya: { increment: totalBiayaRawat } }
                });
            } else {
                const newTagihan = await tx.tagihan.create({
                    data: {
                        id_pasien: id_pasien,
                        total_biaya: totalBiayaRawat,
                        status: 'belum',
                        tanggal_tagihan: new Date().toISOString().split('T')[0],
                        keterangan: `Tagihan rawat inap ${lama} hari di ${ruangan.nama_ruangan}`
                    }
                });
                idTagihan = newTagihan.id;
            }

            // UPDATE ruangan dengan id_tagihan
            await tx.ruangan.update({
                where: { id: idRuangan },
                data: { id_tagihan: idTagihan }
            });

            // UPDATE checkup yang BELUM punya id_tagihan
            const checkupResult = await tx.checkUp.updateMany({
                where: { id_pasien: id_pasien, id_tagihan: null, status: 'selesai' },
                data: { id_tagihan: idTagihan }
            });

            // UPDATE riwayat_obat yang BELUM punya id_tagihan
            const obatResult = await tx.riwayatObat.updateMany({
                where: { id_pasien: id_pasien, id_tagihan: null },
                data: { id_tagihan: idTagihan }
            });

            // REKALKULASI total tagihan
            const total = await hitungTotalTagihan(tx, idTagihan);
            await tx.tagihan.update({
                where: { id: idTagihan },
                data: { total_biaya: total }
            });

            // NOTIFIKASI
            await tx.notifikasi.create({
                data: {
                    jenis: 'pasien_pulang',
                    pesan: `Pasien ID ${id_pasien} telah dipulangkan dari ruangan ${ruangan.nama_ruangan}. Total tagihan: Rp${total}`,
                    tanggal: new Date().toISOString(),
                    dibaca: false
                }
            });

            return { idTagihan, total, checkupResult, obatResult };
        });

        res.json({
            message: 'Pasien berhasil dipulangkan dari ruangan',
            id_tagihan: result.idTagihan,
            lama_inap: lama,
            total_biaya_rawat: totalBiayaRawat,
            total_tagihan: result.total,
            checkup_updated: result.checkupResult.count,
            obat_updated: result.obatResult.count
        });
    } catch (err) {
        console.error('[ERROR] pulangkanDariRuangan:', err);
        handleError(res, err);
    }
};

// ==================== FUNGSI HELP ====================
async function hitungTotalTagihan(tx, idTagihan) {
    const checkupSum = await tx.checkUp.aggregate({
        where: { id_tagihan: idTagihan },
        _sum: { biaya_checkup: true }
    });

    const obatSum = await tx.riwayatObat.aggregate({
        where: { id_tagihan: idTagihan },
        _sum: { total_harga: true }
    });

    const ruanganData = await tx.ruangan.findMany({
        where: { id_tagihan: idTagihan }
    });

    const totalRawatInap = ruanganData.reduce((sum, r) => {
        return sum + (parseFloat(r.biaya_per_hari || 0) * (r.lama_inap || 1));
    }, 0);

    return parseFloat(checkupSum._sum.biaya_checkup || 0) +
           parseFloat(obatSum._sum.total_harga || 0) +
           totalRawatInap;
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
