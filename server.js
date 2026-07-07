const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { passport, JWT_SECRET } = require('./src/config/passport');

// Import routes API
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const akuntanRoutes = require('./src/routes/akuntan');
const apotekerRoutes = require('./src/routes/apoteker');
const dokterRoutes = require('./src/routes/dokter');
const pasienRoutes = require('./src/routes/pasien');

const app = express();

// ========== SET EJS ==========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ========== CORS CONFIG ==========
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));

// ========== PASSPORT INIT ==========
app.use(passport.initialize());

// ========== COOKIE PARSER ==========
app.use(cookieParser());

// ========== BODY PARSER ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== LOGGING ==========
app.use((req, res, next) => {
    console.log('[' + new Date().toLocaleString() + '] ' + req.method + ' ' + req.originalUrl);
    next();
});

// ========== STATIC FILES (CSS, JS, MODELS, CONTROLLERS) ==========
app.use('/assets', express.static(path.join(__dirname, 'src', 'public', 'assets')));
app.use('/css', express.static(path.join(__dirname, 'src', 'public', 'assets', 'css')));
app.use('/js', express.static(path.join(__dirname, 'src', 'public', 'js')));
app.use('/models', express.static(path.join(__dirname, 'src', 'public', 'models')));
app.use('/controllers', express.static(path.join(__dirname, 'src', 'public', 'controllers')));

// ========== AUTH MIDDLEWARE UNTUK HALAMAN (JWT via cookie) ==========
function requireRole(role) {
    return (req, res, next) => {
        const token = req.cookies?.token;
        if (!token) {
            return res.redirect('/login');
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.jabatan !== role) {
                return res.redirect('/login');
            }
            req.user = decoded;
            next();
        } catch (err) {
            return res.redirect('/login');
        }
    };
}

// ========== HALAMAN LOGIN & REGISTER ==========
app.get('/login', (req, res) => {
    // Kalau ada ?expired=1, skip redirect — user sengaja diarahkan ke sini karena 401
    if (req.query.expired === '1') {
        return res.render('login');
    }

    // If already logged in via cookie, redirect to dashboard
    const token = req.cookies?.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return res.redirect('/' + decoded.jabatan);
        } catch (_) {
            // Token invalid, show login
        }
    }
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

// ========== HALAMAN DASHBOARD ==========
app.get('/admin', requireRole('admin'), (req, res) => {
    res.render('admin-home', { username: req.user.username });
});

app.get('/admin/view', requireRole('admin'), (req, res) => {
    res.render('admin-view', { username: req.user.username });
});

app.get('/admin/add', requireRole('admin'), (req, res) => {
    res.render('admin-add', { username: req.user.username });
});

app.get('/akuntan', requireRole('akuntan'), (req, res) => {
    res.render('akuntan', { username: req.user.username });
});

app.get('/apoteker', requireRole('apoteker'), (req, res) => {
    res.render('apoteker', { username: req.user.username });
});

app.get('/dokter', requireRole('dokter'), (req, res) => {
    res.render('dokter', { username: req.user.username });
});

app.get('/pasien', requireRole('pasien'), (req, res) => {
    res.render('pasien', { username: req.user.username });
});

// ========== DEFAULT REDIRECT ==========
app.get('/', (req, res) => {
    res.redirect('/login');
});

// ========== API ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/akuntan', akuntanRoutes);
app.use('/api/apoteker', apotekerRoutes);
app.use('/api/dokter', dokterRoutes);
app.use('/api/pasien', pasienRoutes);

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('===================================================');
    console.log(`✅ Server API berjalan di http://localhost:${PORT}`);
    console.log('   Frontend: http://localhost:3000');
    console.log('===================================================');
    console.log('📋 DAFTAR AKUN DUMMY (Password: admin):');
    console.log('  Admin    : admin1');
    console.log('  Dokter   : dr. Budi / dr. Sinta');
    console.log('  Akuntan  : akuntan1');
    console.log('  Apoteker : apoteker1');
    console.log('  Pasien   : pasien1 / pasien2');
    console.log('===================================================');
});
