const db = require('../config/db');
const bcrypt = require('bcrypt');

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
    
    // Validasi username minimal 3 karakter
    if (username.length < 3) {
        return res.status(400).json({ message: 'Username minimal 3 karakter' });
    }
    
    // Validasi password minimal 4 karakter
    if (password.length < 4) {
        return res.status(400).json({ message: 'Password minimal 4 karakter' });
    }
    
    // Validasi dokterData jika jabatan dokter
    if (jabatan === 'dokter') {
        if (!dokterData || !dokterData.nama_dokter || dokterData.nama_dokter.trim() === '') {
            return res.status(400).json({ message: 'Nama dokter wajib diisi' });
        }
    }
    
    try {
        // ===== CEK USERNAME DUPLIKAT =====
        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ?', 
            [username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username sudah digunakan' });
        }
        
        // ===== HASH PASSWORD =====
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // ===== START TRANSACTION =====
        await db.query('START TRANSACTION');
        
        // ===== INSERT USER =====
        const [result] = await db.query(
            'INSERT INTO users (username, pwd, jabatan) VALUES (?, ?, ?)',
            [username, hashedPassword, jabatan]
        );

        const userId = result.insertId;
        console.log('[REGISTER] User created with ID:', userId);
        
        // ===== INSERT DOKTER (jika jabatan dokter) =====
        if (jabatan === 'dokter' && dokterData) {
            console.log('[REGISTER] Inserting dokter data:', dokterData);
            
            const { nama_dokter, spesialisasi, umur, no_telepon, biaya_honor } = dokterData;
            
            await db.query(
                `INSERT INTO dokter 
                (id_dokter, nama_dokter, spesialisasi, umur, no_telepon, biaya_honor) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    userId, 
                    nama_dokter.trim(), 
                    spesialisasi || null, 
                    umur || null, 
                    no_telepon || null, 
                    biaya_honor || 0
                ]
            );
            console.log('[REGISTER] Dokter data inserted!');
        }
        
        // ===== COMMIT =====
        await db.query('COMMIT');
        console.log('[REGISTER] Transaction committed!');

        res.json({ 
            message: 'Registrasi berhasil', 
            userId,
            jabatan: jabatan
        });
        
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('[REGISTER] Error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
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
            message: 'Username, password, dan jabatan wajib diisi' 
        });
    }

    try {
        console.log('[LOGIN] Mencari user:', { username, jabatan });
        
        const [users] = await db.query(
            'SELECT id, username, pwd, jabatan FROM users WHERE username = ? AND jabatan = ?',
            [username, jabatan]
        );
        
        console.log('[LOGIN] Hasil query:', users.length > 0 ? 'User ditemukan' : 'User tidak ditemukan');
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Username atau jabatan salah' });
        }
        
        const user = users[0];

        console.log('[LOGIN] Membandingkan password...');
        const isValid = await bcrypt.compare(password, user.pwd);
        console.log('[LOGIN] Password valid?', isValid);

        if (!isValid) {
            return res.status(401).json({ message: 'Password salah' });
        }
        
        let nama = username;
        
        // Ambil nama dari tabel yang sesuai
        if (jabatan === 'dokter') {
            const [dokter] = await db.query(
                'SELECT nama_dokter FROM dokter WHERE id_dokter = ?',
                [user.id]
            );
            if (dokter.length > 0) {
                nama = dokter[0].nama_dokter;
            }
        }
        
        if (jabatan === 'admin') {
            const [admin] = await db.query(
                'SELECT nama_admin FROM admin WHERE id_admin = ?',
                [user.id]
            );
            if (admin.length > 0) {
                nama = admin[0].nama_admin;
            }
        }
        
        const sessionData = {
            id: user.id,
            username: user.username,
            jabatan: user.jabatan,
            nama: nama
        };
        
        console.log('[LOGIN] Session data yang akan disimpan:', sessionData);
        
        // Simpan session
        req.session.user = sessionData;
        console.log('[LOGIN] req.session.user setelah assign:', req.session.user);
        
        // Force save session
        req.session.save(function(err) {
            if (err) {
                console.error('[LOGIN] Error saving session:', err);
                return res.status(500).json({ message: 'Gagal menyimpan session: ' + err.message });
            }
            
            console.log('[LOGIN] Session saved! Session ID:', req.sessionID);
            console.log('[LOGIN] Session user setelah save:', req.session.user);
            
            // Set cookie di response
            res.cookie('rumahsehat.sid', req.sessionID, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                path: '/',
                sameSite: 'lax'
            });
            
            res.json({
                message: 'Login berhasil',
                jabatan: sessionData.jabatan,
                nama: sessionData.nama,
                userId: sessionData.id,
                username: sessionData.username
            });
        });
        
    } catch (error) {
        console.error('[LOGIN] Error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// ==================== LOGOUT ====================
exports.logout = (req, res) => {
    console.log('[LOGOUT] User:', req.session?.user?.username || 'Unknown');
    
    req.session.destroy((err) => {
        if (err) {
            console.error('[LOGOUT] Error:', err);
            return res.status(500).json({ message: 'Logout gagal' });
        }
        res.clearCookie('rumahsehat.sid');
        res.json({ message: 'Logout berhasil' });
    });
};

// ==================== CHECK SESSION ====================
exports.checkSession = (req, res) => {
    console.log('[CHECK SESSION] User:', req.session?.user || 'No session');
    if (req.session.user) {
        res.json({
            loggedIn: true,
            user: req.session.user
        });
    } else {
        res.json({
            loggedIn: false
        });
    }
};