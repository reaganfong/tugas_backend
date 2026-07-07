const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

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
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
}));

// ========== SESSION CONFIG ==========
app.use(session({
    secret: 'rumahsehat_secret_key_2024_super_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        path: '/'
    },
    name: 'rumahsehat.sid',
    rolling: true
}));

// ========== BODY PARSER ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== LOGGING ==========
app.use((req, res, next) => {
    console.log('[' + new Date().toLocaleString() + '] ' + req.method + ' ' + req.originalUrl);
    next();
});

// ========== STATIC FILES (CSS, JS, MODELS, CONTROLLERS) ==========
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'src', 'assets')));
app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'src', 'assets', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'frontend', 'src', 'js')));
app.use('/models', express.static(path.join(__dirname, '..', 'frontend', 'src', 'models')));
app.use('/controllers', express.static(path.join(__dirname, '..', 'frontend', 'src', 'controllers')));

// ========== AUTH MIDDLEWARE UNTUK HALAMAN ==========
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

function requireRole(role) {
    return (req, res, next) => {
        if (req.session && req.session.user && req.session.user.jabatan === role) {
            return next();
        }
        res.redirect('/login');
    };
}

// ========== HALAMAN LOGIN & REGISTER ==========
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

// ========== HALAMAN DASHBOARD ==========
app.get('/admin', requireRole('admin'), (req, res) => {
    res.render('admin-home', { username: req.session.user.username });
});

app.get('/admin/view', requireRole('admin'), (req, res) => {
    res.render('admin-view', { username: req.session.user.username });
});

app.get('/admin/add', requireRole('admin'), (req, res) => {
    res.render('admin-add', { username: req.session.user.username });
});

app.get('/akuntan', requireRole('akuntan'), (req, res) => {
    res.render('akuntan', { username: req.session.user.username });
});

app.get('/apoteker', requireRole('apoteker'), (req, res) => {
    res.render('apoteker', { username: req.session.user.username });
});

app.get('/dokter', requireRole('dokter'), (req, res) => {
    res.render('dokter', { username: req.session.user.username });
});

app.get('/pasien', requireRole('pasien'), (req, res) => {
    res.render('pasien', { username: req.session.user.username });
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

// ========== DEBUG: Test session endpoint ==========
app.get('/api/session-test', (req, res) => {
    res.json({
        sessionID: req.sessionID,
        user: req.session?.user || null,
        hasSession: !!req.session?.user
    });
});

// ========== START SERVER ==========
const PORT = 3000;

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