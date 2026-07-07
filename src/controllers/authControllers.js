const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { toInt } = require('../utils/sanitize');
const { JWT_SECRET } = require('../config/passport');
const { handleError } = require('../utils/handleError');

// Helper: generate JWT token
function generateToken(user, nama, profileId = null) {
  const payload = {
    id: user.id,
    username: user.username,
    jabatan: user.jabatan,
    nama: nama,
  };
  if (profileId) payload.profileId = profileId;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  console.log('[REGISTER] ========================================');
  console.log('[REGISTER] Request body:', req.body);
  const { username, password, jabatan, dokterData } = req.body;

  // ===== VALIDASI =====
  if (!username || !password || !jabatan) {
    return res.status(400).json({ message: 'Data tidak lengkap' });
  }

  const validJabatan = ['admin', 'akuntan', 'apoteker', 'dokter', 'pasien'];
  if (!validJabatan.includes(jabatan)) {
    return res.status(400).json({ message: 'Jabatan tidak valid' });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: 'Username minimal 3 karakter' });
  }

  if (password.length < 4) {
    return res.status(400).json({ message: 'Password minimal 4 karakter' });
  }

  if (jabatan === 'dokter') {
    if (!dokterData || !dokterData.nama_dokter || dokterData.nama_dokter.trim() === '') {
      return res.status(400).json({ message: 'Nama dokter wajib diisi' });
    }
  }

  try {
    // ===== CEK USERNAME DUPLIKAT =====
    const existing = await prisma.user.findUnique({ where: { username } });

    if (existing) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // ===== HASH PASSWORD =====
    const hashedPassword = await bcrypt.hash(password, 10);

    // Sanitasi numerik untuk data dokter (validasi sebelum transaksi)
    let umurVal = { value: null };
    let biayaHonorVal = { value: null };
    if (jabatan === 'dokter' && dokterData) {
      umurVal = toInt(dokterData.umur, 'Umur');
      if (umurVal.error) return res.status(400).json({ message: umurVal.error });
      biayaHonorVal = toInt(dokterData.biaya_honor, 'Biaya honor');
      if (biayaHonorVal.error) return res.status(400).json({ message: biayaHonorVal.error });
    }

    // ===== TRANSACTION: create user + profile =====
    const result = await prisma.$transaction(async (tx) => {
      // ===== INSERT USER =====
      const user = await tx.user.create({
        data: {
          username,
          pwd: hashedPassword,
          jabatan,
        },
      });

      console.log('[REGISTER] User created with ID:', user.id);

      // ===== INSERT DOKTER (jika jabatan dokter) =====
      if (jabatan === 'dokter' && dokterData) {
        console.log('[REGISTER] Inserting dokter data:', dokterData);

        const { nama_dokter, spesialisasi, no_telepon } = dokterData;

        await tx.dokter.create({
          data: {
            nama_dokter: nama_dokter.trim(),
            spesialisasi: spesialisasi || null,
            umur: umurVal.value,
            no_telepon: no_telepon || null,
            biaya_honor: biayaHonorVal.value ?? 0,
            userId: user.id,
          },
        });
        console.log('[REGISTER] Dokter data inserted!');
      }

      return user;
    });

    console.log('[REGISTER] Transaction committed!');

    res.json({
      message: 'Registrasi berhasil',
      userId: result.id,
      jabatan: jabatan,
    });
  } catch (error) {
    console.error('[REGISTER] Error:', error);
    handleError(res, error);
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  console.log('[LOGIN] ========================================');
  console.log('[LOGIN] Request body:', req.body);

  const { username, password, jabatan } = req.body;

  if (!username || !password || !jabatan) {
    console.log('[LOGIN] Data tidak lengkap');
    return res.status(400).json({
      message: 'Username, password, dan jabatan wajib diisi',
    });
  }

  try {
    console.log('[LOGIN] Mencari user:', { username, jabatan });

    const user = await prisma.user.findFirst({
      where: {
        username: username,
        jabatan: jabatan,
      },
    });

    console.log('[LOGIN] Hasil query:', user ? 'User ditemukan' : 'User tidak ditemukan');

    if (!user) {
      return res.status(401).json({ message: 'Username atau jabatan salah' });
    }

    console.log('[LOGIN] Membandingkan password...');
    const isValid = await bcrypt.compare(password, user.pwd);
    console.log('[LOGIN] Password valid?', isValid);

    if (!isValid) {
      return res.status(401).json({ message: 'Password salah' });
    }

    let nama = username;

    // Ambil nama & profileId dari tabel yang sesuai
    let profileId = null;
    if (jabatan === 'dokter') {
      const dokter = await prisma.dokter.findUnique({
        where: { userId: user.id },
      });
      if (dokter) {
        nama = dokter.nama_dokter;
        profileId = dokter.id;
      }
    }

    if (jabatan === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { userId: user.id },
      });
      if (admin) {
        nama = admin.nama_admin;
      }
    }

    // Generate JWT
    const token = generateToken(user, nama, profileId);
    console.log('[LOGIN] JWT generated for:', user.username);

    // Set httpOnly cookie (untuk page loads)
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 jam
      path: '/',
      sameSite: 'lax',
    });

    res.json({
      message: 'Login berhasil',
      token: token,
      jabatan: user.jabatan,
      nama: nama,
      userId: user.id,
      username: user.username,
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    handleError(res, error);
  }
};

// ==================== LOGOUT ====================
exports.logout = (req, res) => {
  console.log('[LOGOUT] User:', req.user?.username || 'Unknown');
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logout berhasil' });
};

// ==================== CHECK SESSION / ME ====================
exports.checkSession = (req, res) => {
  // Passport JWT sudah di-attach via middleware, tinggal cek req.user
  if (req.user) {
    console.log('[CHECK SESSION] User:', req.user.username);
    res.json({
      loggedIn: true,
      user: req.user,
    });
  } else {
    console.log('[CHECK SESSION] No user');
    res.json({
      loggedIn: false,
    });
  }
};

// ==================== GET CURRENT USER PROFILE ====================
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Belum login' });
    }

    res.json({
      id: user.id,
      username: user.username,
      jabatan: user.jabatan,
      nama: user.nama,
      profileId: user.profileId || null,
    });
  } catch (error) {
    handleError(res, error);
  }
};
