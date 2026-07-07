// ==================== DARK MODE ====================
(function() {
    const html = document.documentElement;
    const toggleBtn = document.getElementById('themeToggle');
    
    // Jika tombol tidak ada (misal di halaman lain), hentikan
    if (!toggleBtn) {
        console.log('[DARKMODE] Tombol theme tidak ditemukan, mode gelap tidak aktif.');
        return;
    }
    
    const icon = toggleBtn.querySelector('i');
    const text = toggleBtn.querySelector('span');
    
    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('rumahsehat_theme', theme);
        
        if (icon && text) {
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
                text.textContent = 'Light';
            } else {
                icon.className = 'fas fa-moon';
                text.textContent = 'Dark';
            }
        }
    }
    
    // Terapkan tema yang tersimpan, default 'light'
    const savedTheme = localStorage.getItem('rumahsehat_theme') || 'light';
    applyTheme(savedTheme);
    
    // Toggle saat tombol diklik
    toggleBtn.addEventListener('click', function() {
        const current = html.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
    
    console.log('[DARKMODE] Tema awal:', savedTheme);
})();

// ==================== LOGIN ====================

// Flag untuk mencegah multiple request
var isLoggingIn = false;

async function login() {
    // Cegah multiple click
    if (isLoggingIn) {
        console.log('[LOGIN] Masih dalam proses, abaikan...');
        return;
    }
    
    console.log('[LOGIN] Fungsi login dipanggil');
    
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    var jabatanSelect = document.getElementById('jabatan');
    var errorDiv = document.getElementById('error');
    
    if (!usernameInput || !passwordInput || !jabatanSelect || !errorDiv) {
        console.error('[LOGIN] Element tidak ditemukan!');
        return;
    }
    
    var username = usernameInput.value.trim();
    var password = passwordInput.value;
    var jabatan = jabatanSelect.value;
    
    console.log('[LOGIN] Input:', { username: username, jabatan: jabatan });
    
    // RESET error
    errorDiv.innerHTML = '';
    isLoggingIn = true;

    // VALIDASI
    if (!username) {
        displayError(errorDiv, 'Username harus diisi!');
        isLoggingIn = false;
        return;
    }
    if (!password) {
        displayError(errorDiv, 'Password harus diisi!');
        isLoggingIn = false;
        return;
    }
    if (username.length < 3) {
        displayError(errorDiv, 'Username minimal 3 karakter!');
        isLoggingIn = false;
        return;
    }

    // LOADING
    errorDiv.innerHTML = '<div style="background:#eff6ff;color:#1e40af;padding:14px 18px;border-radius:12px;border-left:5px solid #3b82f6;font-weight:500;font-size:0.95rem;display:flex;align-items:center;justify-content:center;gap:12px;"><i class="fas fa-spinner fa-spin" style="font-size:1.2rem;color:#3b82f6;"></i> Memproses login...</div>';

    try {
        console.log('[LOGIN] Mengirim request ke server...');
        
        var response = await apiService.login(username, password, jabatan);
        
        console.log('[LOGIN] Response:', response);

        if (!response || !response.jabatan) {
            throw new Error('Response tidak valid');
        }

        localStorage.setItem('jabatan', response.jabatan);
        localStorage.setItem('username', response.username || username);
        localStorage.setItem('nama', response.nama || username);
        localStorage.setItem('user_id', response.userId || '');
        localStorage.setItem('login_time', new Date().toISOString());

        // Token JWT sudah disimpan oleh apiService.login()

        errorDiv.innerHTML = '<div style="background:#f0fdf4;color:#166534;padding:14px 18px;border-radius:12px;border-left:5px solid #22c55e;font-weight:500;font-size:0.95rem;display:flex;align-items:center;gap:12px;"><i class="fas fa-check-circle" style="font-size:1.2rem;color:#22c55e;"></i> Login berhasil! Mengalihkan ke dashboard...</div>';

        isLoggingIn = false;

        // ✅ Redirect ke dashboard sesuai jabatan
        setTimeout(function() {
            window.location.href = '/' + response.jabatan;
        }, 1500);

    } catch (error) {
        console.error('[LOGIN] Error:', error);
        
        var errorMessage = '';
        
        if (error.status === 401) {
            errorMessage = 'Username atau password salah! Periksa kembali.';
        } else if (error.status === 400) {
            errorMessage = error.message || 'Data tidak lengkap!';
        } else if (error.status === 0) {
            errorMessage = 'Gagal terhubung ke server. Pastikan server berjalan.';
        } else {
            errorMessage = error.message || 'Login gagal! Silakan coba lagi.';
        }
        
        // TAMPILKAN ERROR DI DIV
        displayError(errorDiv, errorMessage);
        
        // Efek shake
        var loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.style.animation = 'shake 0.5s ease';
            setTimeout(function() {
                loginCard.style.animation = '';
            }, 500);
        }
        
        isLoggingIn = false;
        return false;
    }
    
    isLoggingIn = false;
    return false;
}

// ===== FUNGSI UNTUK MENAMPILKAN ERROR DI DIV =====
function displayError(errorDiv, message) {
    errorDiv.innerHTML = 
        '<div id="errorBox" style="' +
        'background:#fef2f2;' +
        'color:#991b1b;' +
        'padding:16px 20px;' +
        'border-radius:12px;' +
        'border-left:5px solid #ef4444;' +
        'font-weight:500;' +
        'font-size:0.95rem;' +
        'box-shadow:0 4px 16px rgba(239,68,68,0.2);' +
        'display:flex;' +
        'align-items:center;' +
        'gap:14px;' +
        'border:1px solid #fecaca;' +
        'position:relative;' +
        'z-index:9999;' +
        '">' +
        '<i class="fas fa-exclamation-circle" style="font-size:1.4rem;color:#ef4444;"></i>' +
        '<span style="flex:1;">' + message + '</span>' +
        '<button onclick="this.parentElement.remove()" style="' +
        'background:none;' +
        'border:none;' +
        'font-size:1.4rem;' +
        'cursor:pointer;' +
        'color:#991b1b;' +
        'padding:0 4px;' +
        'opacity:0.6;' +
        '">&times;</button>' +
        '</div>';
    
    console.log('[LOGIN] Error ditampilkan di div:', message);
}

// ===== PASANG EVENT LISTENER =====
console.log('[LOGIN] Mencari element...');

function setupLogin() {
    var loginBtn = document.getElementById('loginButton');
    var loginForm = document.getElementById('loginForm');
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');

    console.log('[LOGIN] loginBtn:', loginBtn);
    console.log('[LOGIN] loginForm:', loginForm);

    if (loginBtn) {
        var newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        loginBtn = newBtn;
        
        loginBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[LOGIN] Tombol login diklik!');
            login();
            return false;
        };
        console.log('[LOGIN] Event onclick terpasang di button');
    }

    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[LOGIN] Form submit dicegah!');
            login();
            return false;
        };
        console.log('[LOGIN] Event onsubmit terpasang di form');
    }

    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                console.log('[LOGIN] Enter key di username!');
                login();
                return false;
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                console.log('[LOGIN] Enter key di password!');
                login();
                return false;
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLogin);
} else {
    setupLogin();
}

console.log('[LOGIN] loginController.js loaded - Dengan Dark Mode');