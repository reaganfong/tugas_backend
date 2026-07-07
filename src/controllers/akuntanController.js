const prisma = require('../config/prisma');
const { handleError } = require('../utils/handleError');

// ==================== TAGIHAN ====================
const getTagihan = async (req, res) => {
    try {
        const { search, status } = req.query;

        const where = {};
        if (status && (status === 'lunas' || status === 'belum')) {
            where.status = status;
        }

        const rows = await prisma.tagihan.findMany({
            where,
            include: {
                pasien: { select: { nama: true } }
            },
            orderBy: [
                { status: 'desc' },
                { tanggal_tagihan: 'desc' }
            ]
        });

        // Filter by search (search berdasarkan ID)
        let filteredRows = rows;
        if (search) {
            filteredRows = rows.filter(t => t.id === search);
        }

        // Hitung rincian untuk setiap tagihan
        const result = [];
        for (const row of filteredRows) {
            const checkupSum = await prisma.checkUp.aggregate({
                where: { id_tagihan: row.id },
                _sum: { biaya_checkup: true }
            });

            const obatSum = await prisma.riwayatObat.aggregate({
                where: { id_tagihan: row.id },
                _sum: { total_harga: true }
            });

            const ruanganData = await prisma.ruangan.findMany({
                where: { id_tagihan: row.id }
            });

            const totalCheckup = parseFloat(checkupSum._sum.biaya_checkup || 0);
            const totalObat = parseFloat(obatSum._sum.total_harga || 0);
            const totalRawatInap = ruanganData.reduce((sum, r) => {
                return sum + (parseFloat(r.biaya_per_hari || 0) * (r.lama_inap || 1));
            }, 0);
            const totalRincian = totalCheckup + totalObat + totalRawatInap;

            // Jika tidak sesuai, update
            if (Math.abs(totalRincian - parseFloat(row.total_biaya || 0)) > 100) {
                console.log('[AKUNTAN] Update tagihan #' + row.id + ' dari Rp' + row.total_biaya + ' ke Rp' + totalRincian);
                await prisma.tagihan.update({
                    where: { id: row.id },
                    data: { total_biaya: totalRincian }
                });
                row.total_biaya = totalRincian;
            }

            result.push({
                id_tagihan: row.id,
                nama: row.pasien?.nama || '-',
                total_biaya: parseFloat(row.total_biaya || 0),
                status: row.status,
                tanggal_tagihan: row.tanggal_tagihan,
                keterangan: row.keterangan,
                total_checkup: totalCheckup,
                total_obat: totalObat,
                total_rawat_inap: totalRawatInap
            });
        }

        res.json(result);
    } catch (err) {
        console.error('[ERROR] getTagihan:', err);
        handleError(res, err);
    }
};

// ===== UPDATE STATUS TAGIHAN (MANUAL DARI AKUNTAN) =====
const updateTagihanStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;

        if (!status || (status !== 'lunas' && status !== 'belum')) {
            return res.status(400).json({ message: 'Status harus "lunas" atau "belum"' });
        }

        // Rekalkulasi total sebelum update status
        const checkupSum = await prisma.checkUp.aggregate({
            where: { id_tagihan: id },
            _sum: { biaya_checkup: true }
        });

        const obatSum = await prisma.riwayatObat.aggregate({
            where: { id_tagihan: id },
            _sum: { total_harga: true }
        });

        const ruanganData = await prisma.ruangan.findMany({
            where: { id_tagihan: id }
        });

        const totalRawatInap = ruanganData.reduce((sum, r) => {
            return sum + (parseFloat(r.biaya_per_hari || 0) * (r.lama_inap || 1));
        }, 0);

        const totalAkhir = parseFloat(checkupSum._sum.biaya_checkup || 0) +
                           parseFloat(obatSum._sum.total_harga || 0) +
                           totalRawatInap;

        const existing = await prisma.tagihan.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Tagihan tidak ditemukan' });
        }

        await prisma.tagihan.update({
            where: { id },
            data: {
                status: status,
                total_biaya: totalAkhir
            }
        });

        res.json({
            message: 'Status tagihan berhasil diubah',
            total_biaya: totalAkhir
        });
    } catch (err) {
        console.error('[ERROR] updateTagihanStatus:', err);
        handleError(res, err);
    }
};

// ===== BATALKAN LUNAS =====
const batalkanLunas = async (req, res) => {
    try {
        const id = req.params.id;

        const existing = await prisma.tagihan.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Tagihan tidak ditemukan' });
        }

        await prisma.tagihan.update({
            where: { id },
            data: { status: 'belum' }
        });

        res.json({ message: 'Status tagihan dikembalikan ke belum lunas' });
    } catch (err) {
        handleError(res, err);
    }
};

// ===== TAMBAH TAGIHAN BARU =====
const addTagihan = async (req, res) => {
    try {
        const { id_pasien, total_biaya, keterangan } = req.body;

        if (!id_pasien || !total_biaya) {
            return res.status(400).json({ message: 'ID Pasien dan Total Biaya wajib diisi' });
        }

        const result = await prisma.tagihan.create({
            data: {
                id_pasien: id_pasien,
                total_biaya: parseFloat(total_biaya),
                status: 'belum',
                tanggal_tagihan: new Date().toISOString().split('T')[0],
                keterangan: keterangan || ''
            }
        });

        res.json({
            message: 'Tagihan berhasil ditambahkan',
            id_tagihan: result.id
        });
    } catch (err) {
        console.error('[ERROR] addTagihan:', err);
        handleError(res, err);
    }
};

// ==================== FASILITAS ====================
const getFasilitas = async (req, res) => {
    try {
        const rows = await prisma.fasilitas.findMany();
        const rusak = rows.filter(f => f.status === 'rusak');
        const result = rows.map(f => ({
            id_fasilitas: f.id,
            nama_fasilitas: f.nama_fasilitas,
            status: f.status
        }));
        res.json({
            fasilitas: result,
            notifikasi_rusak: rusak
        });
    } catch (err) {
        handleError(res, err);
    }
};

const toggleFasilitasStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const fasilitas = await prisma.fasilitas.findUnique({ where: { id } });
        if (!fasilitas) {
            return res.status(404).json({ message: 'Fasilitas tidak ditemukan' });
        }

        const newStatus = fasilitas.status === 'baik' ? 'rusak' : 'baik';
        await prisma.fasilitas.update({
            where: { id },
            data: { status: newStatus }
        });

        if (newStatus === 'rusak') {
            await prisma.notifikasi.create({
                data: {
                    jenis: 'fasilitas_rusak',
                    pesan: `Fasilitas ${fasilitas.nama_fasilitas} berstatus rusak. Perlu perbaikan.`,
                    tanggal: new Date().toISOString(),
                    dibaca: false
                }
            });
        }

        res.json({ message: 'Status fasilitas berhasil diubah', status: newStatus });
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== CHECK-IN / CHECK-OUT ====================
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

        const formatted = rows.map(row => ({
            id_checkup: row.id,
            nama_pasien: row.pasien?.nama || '-',
            nama_dokter: row.dokter?.nama_dokter || '-',
            tanggal: row.tanggal,
            jam: row.jam,
            checkout: row.checkout,
            keterangan: row.keterangan,
            biaya_checkup: row.biaya_checkup,
            jam_tanggal_checkin: row.tanggal && row.jam ? `${row.tanggal}T${row.jam}` : null,
            jam_tanggal_checkout: row.checkout || null
        }));

        res.json(formatted);
    } catch (err) {
        handleError(res, err);
    }
};

// ==================== DETAIL TAGIHAN ====================
const getDetailTagihan = async (req, res) => {
    try {
        const idTagihan = req.params.id;

        const tagihan = await prisma.tagihan.findUnique({
            where: { id: idTagihan },
            include: {
                pasien: { select: { id: true, nama: true, no_telp_pasien: true } }
            }
        });

        if (!tagihan) {
            return res.status(404).json({ message: 'Tagihan tidak ditemukan' });
        }

        const idPasien = tagihan.id_pasien;

        // CHECKUP
        const checkupRows = await prisma.checkUp.findMany({
            where: {
                id_pasien: idPasien,
                id_tagihan: idTagihan
            },
            include: {
                dokter: { select: { nama_dokter: true } }
            },
            orderBy: [
                { tanggal: 'desc' },
                { jam: 'desc' }
            ]
        });

        // OBAT
        const obatRows = await prisma.riwayatObat.findMany({
            where: {
                id_pasien: idPasien,
                id_tagihan: idTagihan
            },
            include: {
                obat: { select: { nama_obat: true, harga: true } }
            },
            orderBy: { tanggal: 'desc' }
        });

        // RAWAT INAP
        const ruanganRows = await prisma.ruangan.findMany({
            where: { id_tagihan: idTagihan }
        });

        // HITUNG TOTAL
        let totalDariCheckup = 0;
        let totalDariObat = 0;
        let totalDariRuangan = 0;

        const checkupItems = checkupRows.map(c => {
            totalDariCheckup += parseFloat(c.biaya_checkup || 0);
            return {
                id_checkup: c.id,
                tanggal: c.tanggal,
                jam: c.jam,
                biaya_checkup: c.biaya_checkup,
                nama_dokter: c.dokter?.nama_dokter || '-',
                keterangan: c.keterangan
            };
        });

        const obatItems = obatRows.map(o => {
            totalDariObat += parseFloat(o.total_harga || 0);
            return {
                id_riwayat: o.id,
                nama_obat: o.obat?.nama_obat || '-',
                harga: o.obat?.harga || 0,
                jumlah: o.jumlah,
                total_harga: o.total_harga
            };
        });

        const ruanganItems = ruanganRows.map(r => {
            const totalRuangan = parseFloat(r.biaya_per_hari || 0) * (r.lama_inap || 1);
            totalDariRuangan += totalRuangan;
            return {
                id_ruangan: r.id,
                nama_ruangan: r.nama_ruangan,
                nomor_ruangan: r.nomor_ruangan,
                biaya_per_hari: r.biaya_per_hari,
                lama_inap: r.lama_inap || 1,
                tanggal_checkin: r.tanggal_checkin,
                total_biaya_ruangan: totalRuangan
            };
        });

        const totalRincian = totalDariCheckup + totalDariObat + totalDariRuangan;

        console.log('[DETAIL] Total rincian:', {
            checkup: totalDariCheckup,
            obat: totalDariObat,
            rawat_inap: totalDariRuangan,
            total: totalRincian
        });

        // Jika total tidak sesuai, update tagihan
        const currentTotal = parseFloat(tagihan.total_biaya) || 0;
        if (Math.abs(totalRincian - currentTotal) > 100) {
            console.log('[AKUNTAN] Total tidak sesuai, update tagihan:', {
                old: currentTotal,
                new: totalRincian
            });
            await prisma.tagihan.update({
                where: { id: idTagihan },
                data: { total_biaya: totalRincian }
            });
            tagihan.total_biaya = totalRincian;
        }

        res.json({
            tagihan: {
                id_tagihan: tagihan.id,
                id_pasien: tagihan.id_pasien,
                nama: tagihan.pasien?.nama || '-',
                total_biaya: parseFloat(tagihan.total_biaya),
                status: tagihan.status,
                tanggal_tagihan: tagihan.tanggal_tagihan,
                keterangan: tagihan.keterangan
            },
            rincian: {
                checkup: {
                    total: totalDariCheckup,
                    items: checkupItems
                },
                obat: {
                    total: totalDariObat,
                    items: obatItems
                },
                rawat_inap: {
                    total: totalDariRuangan,
                    items: ruanganItems
                }
            },
            total_rincian: totalRincian
        });
    } catch (err) {
        console.error('[ERROR] getDetailTagihan:', err);
        handleError(res, err);
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
