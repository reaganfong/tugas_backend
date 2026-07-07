const prisma = require('../config/prisma');
const { handleError } = require('../utils/handleError');

// Get profil pasien dari ID
const getProfilById = async (req, res) => {
    const pasienId = req.params.id;

    if (!pasienId) {
        return res.status(400).json({ message: 'ID pasien diperlukan' });
    }

    try {
        const pasien = await prisma.pasien.findUnique({
            where: { id: pasienId }
        });

        if (!pasien) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }

        // Ambil data dokter yang menangani
        const checkups = await prisma.checkUp.findMany({
            where: { id_pasien: pasienId },
            include: { dokter: true },
            take: 1,
            orderBy: { tanggal: 'desc' }
        });

        const dokterRows = checkups.filter(c => c.dokter).map(c => ({
            id_dokter: c.dokter.id,
            nama_dokter: c.dokter.nama_dokter,
            spesialisasi: c.dokter.spesialisasi
        }));

        // Ambil riwayat checkup
        const riwayatRows = await prisma.checkUp.findMany({
            where: { id_pasien: pasienId },
            include: { dokter: true },
            orderBy: [
                { tanggal: 'desc' },
                { jam: 'desc' }
            ]
        });

        const riwayatFormatted = riwayatRows.map(row => {
            const tanggal = row.tanggal ? `${row.tanggal}` : '';
            const jam = row.jam ? `${row.jam}` : '';
            const checkinFormatted = tanggal && jam ? `${tanggal} pukul ${jam.replace(':', '.')}` : '-';

            return {
                id_checkup: row.id,
                jam: row.jam,
                tanggal: row.tanggal,
                checkout: row.checkout,
                keterangan: row.keterangan,
                biaya_checkup: row.biaya_checkup,
                nama_dokter: row.dokter?.nama_dokter || '-',
                status: row.status,
                checkin_formatted: checkinFormatted,
                checkout_formatted: row.checkout
                    ? new Date(row.checkout).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : '-'
            };
        });

        // Ambil tagihan terakhir dengan rincian
        const tagihanRows = await prisma.tagihan.findMany({
            where: { id_pasien: pasienId },
            orderBy: { tanggal_tagihan: 'desc' },
            take: 1
        });

        let tagihanData = null;
        if (tagihanRows.length > 0) {
            const tagihan = tagihanRows[0];

            // Hitung rincian
            const checkupSum = await prisma.checkUp.aggregate({
                where: { id_tagihan: tagihan.id },
                _sum: { biaya_checkup: true }
            });

            const obatSum = await prisma.riwayatObat.aggregate({
                where: { id_tagihan: tagihan.id },
                _sum: { total_harga: true }
            });

            const ruanganData = await prisma.ruangan.findMany({
                where: { id_tagihan: tagihan.id }
            });

            const totalRawatInap = ruanganData.reduce((sum, r) => {
                return sum + (parseFloat(r.biaya_per_hari || 0) * (r.lama_inap || 1));
            }, 0);

            const totalCheckup = parseFloat(checkupSum._sum.biaya_checkup || 0);
            const totalObat = parseFloat(obatSum._sum.total_harga || 0);
            const totalRincian = totalCheckup + totalObat + totalRawatInap;

            // Update jika tidak sesuai
            if (Math.abs(totalRincian - parseFloat(tagihan.total_biaya || 0)) > 100) {
                await prisma.tagihan.update({
                    where: { id: tagihan.id },
                    data: { total_biaya: totalRincian }
                });
                tagihan.total_biaya = totalRincian;
            }

            tagihanData = {
                id_tagihan: tagihan.id,
                total_biaya: parseFloat(tagihan.total_biaya),
                status: tagihan.status,
                tanggal_tagihan: tagihan.tanggal_tagihan,
                keterangan: tagihan.keterangan,
                total_checkup: totalCheckup,
                total_obat: totalObat,
                total_rawat_inap: totalRawatInap
            };
        }

        res.json({
            pasien: pasien,
            dokter: dokterRows[0] || null,
            riwayat: riwayatFormatted,
            tagihan: tagihanData || null
        });

    } catch (err) {
        console.error(err);
        handleError(res, err);
    }
};

// Search pasien dari ID atau nama
const searchPasien = async (req, res) => {
    const { id, nama } = req.query;

    try {
        let pasien;

        if (id) {
            pasien = await prisma.pasien.findUnique({
                where: { id: id }
            });
        } else if (nama) {
            pasien = await prisma.pasien.findFirst({
                where: {
                    nama: {
                        contains: nama,
                        mode: 'insensitive'
                    }
                }
            });
        } else {
            return res.status(400).json({ message: 'Parameter id atau nama diperlukan' });
        }

        if (!pasien) {
            return res.status(404).json({ message: 'Pasien tidak ditemukan' });
        }

        // Ambil dokter yang menangani
        const checkups = await prisma.checkUp.findMany({
            where: { id_pasien: pasien.id },
            include: { dokter: true },
            take: 1,
            orderBy: { tanggal: 'desc' }
        });

        const dokterRows = checkups.filter(c => c.dokter).map(c => ({
            id_dokter: c.dokter.id,
            nama_dokter: c.dokter.nama_dokter,
            spesialisasi: c.dokter.spesialisasi
        }));

        // Ambil riwayat checkup
        const riwayatRows = await prisma.checkUp.findMany({
            where: { id_pasien: pasien.id },
            include: { dokter: true },
            orderBy: [
                { tanggal: 'desc' },
                { jam: 'desc' }
            ]
        });

        const riwayatFormatted = riwayatRows.map(row => {
            const tanggal = row.tanggal || '';
            const jam = row.jam || '';

            return {
                id_checkup: row.id,
                jam: row.jam,
                tanggal: row.tanggal,
                checkout: row.checkout,
                keterangan: row.keterangan,
                biaya_checkup: row.biaya_checkup,
                nama_dokter: row.dokter?.nama_dokter || '-',
                status: row.status,
                checkin_formatted: tanggal && jam ? `${tanggal} pukul ${jam.replace(':', '.')}` : '-',
                checkout_formatted: row.checkout
                    ? new Date(row.checkout).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : '-'
            };
        });

        // Ambil tagihan dengan rincian
        const tagihanRows = await prisma.tagihan.findMany({
            where: { id_pasien: pasien.id },
            orderBy: { tanggal_tagihan: 'desc' },
            take: 1
        });

        let tagihanData = null;
        if (tagihanRows.length > 0) {
            const tagihan = tagihanRows[0];

            const checkupSum = await prisma.checkUp.aggregate({
                where: { id_tagihan: tagihan.id },
                _sum: { biaya_checkup: true }
            });

            const obatSum = await prisma.riwayatObat.aggregate({
                where: { id_tagihan: tagihan.id },
                _sum: { total_harga: true }
            });

            const ruanganData = await prisma.ruangan.findMany({
                where: { id_tagihan: tagihan.id }
            });

            const totalRawatInap = ruanganData.reduce((sum, r) => {
                return sum + (parseFloat(r.biaya_per_hari || 0) * (r.lama_inap || 1));
            }, 0);

            const totalCheckup = parseFloat(checkupSum._sum.biaya_checkup || 0);
            const totalObat = parseFloat(obatSum._sum.total_harga || 0);
            const totalRincian = totalCheckup + totalObat + totalRawatInap;

            if (Math.abs(totalRincian - parseFloat(tagihan.total_biaya || 0)) > 100) {
                await prisma.tagihan.update({
                    where: { id: tagihan.id },
                    data: { total_biaya: totalRincian }
                });
                tagihan.total_biaya = totalRincian;
            }

            tagihanData = {
                id_tagihan: tagihan.id,
                total_biaya: parseFloat(tagihan.total_biaya),
                status: tagihan.status,
                tanggal_tagihan: tagihan.tanggal_tagihan,
                keterangan: tagihan.keterangan,
                total_checkup: totalCheckup,
                total_obat: totalObat,
                total_rawat_inap: totalRawatInap
            };
        }

        res.json({
            pasien: pasien,
            dokter: dokterRows[0] || null,
            riwayat: riwayatFormatted,
            tagihan: tagihanData || null
        });

    } catch (err) {
        console.error(err);
        handleError(res, err);
    }
};

module.exports = {
    getProfilById,
    searchPasien
};
