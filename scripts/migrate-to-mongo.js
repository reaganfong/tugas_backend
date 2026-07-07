/**
 * scripts/migrate-to-mongo.js
 * ============================
 * Migrasi data dari dump MySQL (rumahsehat (8).sql) ke MongoDB Atlas via Prisma.
 *
 * Cara pakai:
 *   node scripts/migrate-to-mongo.js
 *
 * Urutan migrasi (ikut dependency):
 *   1. users → admin, dokter
 *   2. stok_obat, pasien, bayi, fasilitas, notifikasi, staff
 *   3. tagihan
 *   4. check_up → riwayat_obat, ruangan
 *   5. shift_staff, shift_users
 */

// Resolve @prisma/client from project root node_modules
const path = require('path');
const prismaPath = path.resolve(__dirname, '..', 'node_modules', '@prisma', 'client');
const { PrismaClient } = require(prismaPath);
const fs = require('fs');

const prisma = new PrismaClient();

// --- ID MAPPING ---
const idMap = {
  users: {}, admin: {}, dokter: {}, stok_obat: {},
  pasien: {}, tagihan: {}, check_up: {}, riwayat_obat: {},
  ruangan: {}, bayi: {}, fasilitas: {}, notifikasi: {},
  staff: {}, shift_staff: {}, shift_users: {},
};

// ==========================================================
//  1. PARSE SQL DUMP — simple & robust
// ==========================================================

/**
 * Extract all INSERT statements and return { tableName: [row1, row2, ...] }
 * Handles multi-line VALUES and standard mysqldump format.
 */
function parseSQL(sql) {
  const data = {};

  // Match: INSERT INTO `table` (col1, col2) VALUES (val1, val2), (val3, val4);
  // Capture table name, columns, and values block
  const insertRegex = /INSERT\s+INTO\s+`(\w+)`\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/g;

  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const table = match[1];
    const cols = match[2].split(',').map(c => c.trim().replace(/`/g, ''));
    let valuesBlock = match[3].trim();

    if (!data[table]) data[table] = [];

    // Parse value tuples: (v1, v2, v3), (v4, v5, v6)
    let i = 0;
    while (i < valuesBlock.length) {
      // Skip whitespace and commas between tuples
      while (i < valuesBlock.length && (valuesBlock[i] === ' ' || valuesBlock[i] === ',' || valuesBlock[i] === '\n' || valuesBlock[i] === '\r')) i++;
      if (i >= valuesBlock.length || valuesBlock[i] !== '(') break;

      // Find matching closing paren — properly skipping string literals
      let depth = 0;
      let inStr = false;
      let j = i;
      while (j < valuesBlock.length) {
        if (!inStr) {
          if (valuesBlock[j] === "'") {
            inStr = true;
          } else if (valuesBlock[j] === '(') {
            depth++;
          } else if (valuesBlock[j] === ')') {
            depth--;
            if (depth === 0) break;
          }
        } else {
          // Inside string — end quote or escaped quote (SQL style: '')
          if (valuesBlock[j] === "'") {
            if (j + 1 < valuesBlock.length && valuesBlock[j + 1] === "'") {
              j++; // skip escaped quote
            } else {
              inStr = false;
            }
          }
        }
        j++;
      }

      const tuple = valuesBlock.substring(i + 1, j);
      const values = parseTuple(tuple);

      const row = {};
      cols.forEach((col, idx) => {
        row[col] = idx < values.length ? values[idx] : null;
      });
      data[table].push(row);

      i = j + 1; // Move past closing paren
    }
  }

  return data;
}

/**
 * Parse a single value tuple: 'string', 123, NULL, 'escaped''quote'
 */
function parseTuple(tuple) {
  const values = [];
  let current = '';
  let inStr = false;
  let strChar = null;

  for (let i = 0; i < tuple.length; i++) {
    const ch = tuple[i];

    if (!inStr) {
      if (ch === "'" || ch === '"') {
        // Trim whitespace from any unquoted value before the string starts
        if (current.trim() !== '') {
          values.push(cleanValue(current.trim()));
        }
        current = ''; // reset — string content starts fresh
        inStr = true;
        strChar = ch;
        continue;
      }
      if (ch === ',') {
        if (current.trim() !== '') {
          values.push(cleanValue(current.trim()));
        }
        current = '';
        continue;
      }
      current += ch;
    } else {
      // Inside string
      if (ch === strChar) {
        // Check for escaped quote (SQL style: '' or \')
        if (i + 1 < tuple.length && tuple[i + 1] === strChar) {
          current += strChar;
          i++; // skip next
          continue;
        }
        // End of string
        inStr = false;
        values.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
  }

  // Last value
  if (current.trim() !== '') {
    values.push(cleanValue(current.trim()));
  }

  return values;
}

function cleanValue(val) {
  if (val === 'NULL' || val === null || val === undefined) return null;
  val = val.trim();
  if (val === 'NULL') return null;
  if (val === 'TRUE' || val === 'true') return true;
  if (val === 'FALSE' || val === 'false') return false;
  // Try number
  const num = Number(val);
  if (!isNaN(num) && val !== '') return num;
  return val;
}

// ==========================================================
//  2. MIGRATION FUNCTIONS
// ==========================================================

async function migrateUsers(rows) {
  console.log(`\n📦 Migrating ${rows.length} users...`);
  for (const row of rows) {
    const created = await prisma.user.create({
      data: { username: row.username, pwd: row.pwd, jabatan: row.jabatan }
    });
    idMap.users[Number(row.id)] = created.id;
  }
  console.log(`  ✅ ${rows.length} users migrated`);
}

async function migrateAdmin(rows) {
  console.log(`\n📦 Migrating ${rows.length} admin...`);
  for (const row of rows) {
    const userId = idMap.users[Number(row.id_admin)];
    if (!userId) { console.warn(`  ⚠️  Admin id=${row.id_admin}: user not found`); continue; }
    const created = await prisma.admin.create({
      data: { nama_admin: row.nama_admin, userId }
    });
    idMap.admin[Number(row.id_admin)] = created.id;
  }
  console.log(`  ✅ Admin migrated`);
}

async function migrateDokter(rows) {
  console.log(`\n📦 Migrating ${rows.length} dokter...`);
  for (const row of rows) {
    const userId = idMap.users[Number(row.id_dokter)];
    if (!userId) { console.warn(`  ⚠️  Dokter id=${row.id_dokter}: user not found`); continue; }
    const created = await prisma.dokter.create({
      data: {
        nama_dokter: row.nama_dokter, spesialisasi: row.spesialisasi,
        umur: row.umur, no_telepon: row.no_telepon,
        biaya_honor: row.biaya_honor, userId
      }
    });
    idMap.dokter[Number(row.id_dokter)] = created.id;
  }
  console.log(`  ✅ Dokter migrated`);
}

async function migrateStokObat(rows) {
  console.log(`\n📦 Migrating ${rows.length} stok_obat...`);
  for (const row of rows) {
    const created = await prisma.stokObat.create({
      data: {
        nama_obat: row.nama_obat, stok: row.stok,
        batas_notifikasi: row.batas_notifikasi,
        tanggal_restok_terakhir: row.tanggal_restok_terakhir,
        harga: row.harga
      }
    });
    idMap.stok_obat[Number(row.id_obat)] = created.id;
  }
  console.log(`  ✅ StokObat migrated`);
}

async function migratePasien(rows) {
  console.log(`\n📦 Migrating ${rows.length} pasien...`);
  for (const row of rows) {
    const created = await prisma.pasien.create({
      data: {
        nama: row.nama, nama_wali: row.nama_wali,
        jenis_penyakit: row.jenis_penyakit, nama_penyakit: row.nama_penyakit,
        umur: row.umur, jenis_kelamin: row.jenis_kelamin,
        no_telp_pasien: row.no_telp_pasien, no_telp_wali: row.no_telp_wali,
        deskripsi_dokter: row.deskripsi_dokter, msh_dirawat: row.msh_dirawat || 'baru'
      }
    });
    idMap.pasien[Number(row.id_pasien)] = created.id;
  }
  console.log(`  ✅ Pasien migrated`);
}

async function migrateBayi(rows) {
  console.log(`\n📦 Migrating ${rows.length} bayi...`);
  for (const row of rows) {
    await prisma.bayi.create({
      data: {
        id_ibu: Number(row.id_ibu), nama_ibu: row.nama_ibu,
        nama_bayi: row.nama_bayi, jenis_kelamin: row.jenis_kelamin,
        berat: row.berat !== null ? Number(row.berat) : null,
        tinggi: row.tinggi !== null ? Number(row.tinggi) : null
      }
    });
  }
  console.log(`  ✅ Bayi migrated`);
}

async function migrateFasilitas(rows) {
  console.log(`\n📦 Migrating ${rows.length} fasilitas...`);
  for (const row of rows) {
    await prisma.fasilitas.create({
      data: { nama_fasilitas: row.nama_fasilitas, status: row.status || 'baik' }
    });
  }
  console.log(`  ✅ Fasilitas migrated`);
}

async function migrateNotifikasi(rows) {
  console.log(`\n📦 Migrating ${rows.length} notifikasi...`);
  for (const row of rows) {
    await prisma.notifikasi.create({
      data: {
        jenis: row.jenis, pesan: row.pesan,
        tanggal: row.tanggal ? new Date(row.tanggal).toISOString() : null,
        dibaca: row.dibaca === 1 || row.dibaca === true
      }
    });
  }
  console.log(`  ✅ Notifikasi migrated`);
}

async function migrateStaff(rows) {
  console.log(`\n📦 Migrating ${rows.length} staff...`);
  for (const row of rows) {
    const created = await prisma.staff.create({
      data: {
        jabatan: row.jabatan, nama_staff: row.nama_staff,
        no_telepon: row.no_telepon, gaji: row.gaji
      }
    });
    idMap.staff[Number(row.id_staff)] = created.id;
  }
  console.log(`  ✅ Staff migrated`);
}

async function migrateTagihan(rows) {
  console.log(`\n📦 Migrating ${rows.length} tagihan...`);
  for (const row of rows) {
    const pasienId = idMap.pasien[Number(row.id_pasien)];
    if (!pasienId) { console.warn(`  ⚠️  Tagihan id=${row.id_tagihan}: pasien ${row.id_pasien} not found`); continue; }
    const created = await prisma.tagihan.create({
      data: {
        id_pasien: pasienId, total_biaya: row.total_biaya !== null ? Number(row.total_biaya) : null,
        status: row.status || 'belum', tanggal_tagihan: row.tanggal_tagihan,
        keterangan: row.keterangan || ''
      }
    });
    idMap.tagihan[Number(row.id_tagihan)] = created.id;
  }
  console.log(`  ✅ Tagihan migrated`);
}

async function migrateCheckup(rows) {
  console.log(`\n📦 Migrating ${rows.length} check_up...`);
  for (const row of rows) {
    const pasienId = idMap.pasien[Number(row.id_pasien)];
    const dokterId = row.id_dokter ? idMap.dokter[Number(row.id_dokter)] : null;
    const tagihanId = row.id_tagihan ? idMap.tagihan[Number(row.id_tagihan)] : null;
    if (!pasienId) { console.warn(`  ⚠️  CheckUp id=${row.id_checkup}: pasien ${row.id_pasien} not found`); continue; }
    const created = await prisma.checkUp.create({
      data: {
        id_pasien: pasienId, id_dokter: dokterId,
        tanggal: row.tanggal, jam: row.jam,
        checkout: row.checkout ? new Date(row.checkout).toISOString() : null,
        status: row.status || 'terjadwal', keterangan: row.keterangan,
        rekomendasi_obat: row.rekomendasi_obat,
        biaya_checkup: row.biaya_checkup !== null ? Number(row.biaya_checkup) : 0,
        id_tagihan: tagihanId
      }
    });
    idMap.check_up[Number(row.id_checkup)] = created.id;
  }
  console.log(`  ✅ CheckUp migrated`);
}

async function migrateRiwayatObat(rows) {
  console.log(`\n📦 Migrating ${rows.length} riwayat_obat...`);
  for (const row of rows) {
    const checkupId = row.id_checkup ? idMap.check_up[Number(row.id_checkup)] : null;
    const pasienId = row.id_pasien ? idMap.pasien[Number(row.id_pasien)] : null;
    const obatId = row.id_obat ? idMap.stok_obat[Number(row.id_obat)] : null;
    const tagihanId = row.id_tagihan ? idMap.tagihan[Number(row.id_tagihan)] : null;
    await prisma.riwayatObat.create({
      data: {
        id_checkup: checkupId, id_pasien: pasienId, id_obat: obatId,
        jumlah: row.jumlah || 1, total_harga: row.total_harga !== null ? Number(row.total_harga) : null,
        id_tagihan: tagihanId, tanggal: row.tanggal ? new Date(row.tanggal).toISOString() : null
      }
    });
  }
  console.log(`  ✅ RiwayatObat migrated`);
}

async function migrateRuangan(rows) {
  console.log(`\n📦 Migrating ${rows.length} ruangan...`);
  for (const row of rows) {
    const pasienId = row.ditempati ? idMap.pasien[Number(row.ditempati)] : null;
    const tagihanId = row.id_tagihan ? idMap.tagihan[Number(row.id_tagihan)] : null;
    await prisma.ruangan.create({
      data: {
        nama_ruangan: row.nama_ruangan, nomor_ruangan: row.nomor_ruangan,
        ditempati: pasienId, status: row.status || 'kosong',
        biaya_per_hari: row.biaya_per_hari !== null ? Number(row.biaya_per_hari) : 0,
        id_tagihan: tagihanId,
        tanggal_checkin: row.tanggal_checkin ? new Date(row.tanggal_checkin).toISOString() : null,
        lama_inap: row.lama_inap
      }
    });
  }
  console.log(`  ✅ Ruangan migrated`);
}

async function migrateShiftStaff(rows) {
  console.log(`\n📦 Migrating ${rows.length} shift_staff...`);
  let count = 0;
  for (const row of rows) {
    const staffId = idMap.staff[Number(row.id_staff)];
    if (!staffId) { console.warn(`  ⚠️  ShiftStaff id=${row.id_shift}: staff ${row.id_staff} not found`); continue; }
    await prisma.shiftStaff.create({ data: { id_staff: staffId, hari: row.hari, shift: row.shift } });
    count++;
  }
  console.log(`  ✅ ${count} ShiftStaff migrated`);
}

async function migrateShiftUsers(rows) {
  console.log(`\n📦 Migrating ${rows.length} shift_users...`);
  let count = 0;
  for (const row of rows) {
    const userId = idMap.users[Number(row.id_users)];
    if (!userId) { console.warn(`  ⚠️  ShiftUser id=${row.id_shift}: user ${row.id_users} not found`); continue; }
    await prisma.shiftUser.create({ data: { id_users: userId, hari: row.hari, shift: row.shift } });
    count++;
  }
  console.log(`  ✅ ${count} ShiftUser migrated`);
}

// ==========================================================
//  3. MAIN
// ==========================================================

async function main() {
  console.log('=============================================');
  console.log('  🏥 Rumah Sehat — MySQL → MongoDB Migration');
  console.log('=============================================\n');

  const sqlPath = path.resolve(__dirname, '..', 'database', 'rumahsehat (8).sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL dump not found at: ${sqlPath}`);
    process.exit(1);
  }

  console.log(`📖 Reading: ${sqlPath}`);
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const data = parseSQL(sql);

  const tables = Object.keys(data);
  console.log(`📊 Found tables: ${tables.join(', ')}`);
  console.log(`   Rows: ${tables.reduce((s, t) => s + data[t].length, 0)}`);

  if (tables.length === 0) {
    console.error('❌ No INSERT statements found! Check SQL format.');
    process.exit(1);
  }

  // Phase 1
  console.log('\n═══ PHASE 1: Users + independent ═══');
  if (data.users) await migrateUsers(data.users);
  if (data.admin) await migrateAdmin(data.admin);
  if (data.dokter) await migrateDokter(data.dokter);
  if (data.stok_obat) await migrateStokObat(data.stok_obat);
  if (data.pasien) await migratePasien(data.pasien);
  if (data.bayi) await migrateBayi(data.bayi);
  if (data.fasilitas) await migrateFasilitas(data.fasilitas);
  if (data.notifikasi) await migrateNotifikasi(data.notifikasi);
  if (data.staff) await migrateStaff(data.staff);

  // Phase 2
  console.log('\n═══ PHASE 2: Tagihan ═══');
  if (data.tagihan) await migrateTagihan(data.tagihan);

  // Phase 3
  console.log('\n═══ PHASE 3: CheckUp, RiwayatObat, Ruangan ═══');
  if (data.check_up) await migrateCheckup(data.check_up);
  if (data.riwayat_obat) await migrateRiwayatObat(data.riwayat_obat);
  if (data.ruangan) await migrateRuangan(data.ruangan);

  // Phase 4
  console.log('\n═══ PHASE 4: Shifts ═══');
  if (data.shift_staff) await migrateShiftStaff(data.shift_staff);
  if (data.shift_users) await migrateShiftUsers(data.shift_users);

  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅ MIGRATION COMPLETE!');
  for (const [table, map] of Object.entries(idMap)) {
    const count = Object.keys(map).length;
    if (count > 0) console.log(`     ${table}: ${count}`);
  }
  console.log('═══════════════════════════════════════════\n');
}

main()
  .catch(e => { console.error('\n❌ Migration failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
