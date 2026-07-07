const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// Extend Prisma Client with cascade delete behavior
// Prisma + MongoDB tidak support cascade delete native di level DB
const extendedPrisma = prisma.$extends({
  query: {
    pasien: {
      async delete({ args, query }) {
        const id = args.where.id;

        // 1. Delete checkups yang refer ke pasien
        await prisma.checkUp.deleteMany({ where: { id_pasien: id } });

        // 2. Delete riwayat_obat
        await prisma.riwayatObat.deleteMany({ where: { id_pasien: id } });

        // 3. Set null di ruangan (ON DELETE SET NULL analog)
        await prisma.ruangan.updateMany({
          where: { ditempati: id },
          data: { ditempati: null, status: 'kosong', id_tagihan: null }
        });

        // 4. Delete tagihan
        await prisma.tagihan.deleteMany({ where: { id_pasien: id } });

        return query(args);
      }
    },
    dokter: {
      async delete({ args, query }) {
        const id = args.where.id;

        // Set id_dokter = null di check_up yang refer (ON DELETE SET NULL analog)
        await prisma.checkUp.updateMany({
          where: { id_dokter: id },
          data: { id_dokter: null }
        });

        return query(args);
      }
    },
    stokObat: {
      async delete({ args, query }) {
        const id = args.where.id;

        // Set null di riwayat_obat
        await prisma.riwayatObat.updateMany({
          where: { id_obat: id },
          data: { id_obat: null }
        });

        return query(args);
      }
    }
  }
});

module.exports = extendedPrisma;

console.log('[Prisma] PrismaClient initialized with cascade extensions');
