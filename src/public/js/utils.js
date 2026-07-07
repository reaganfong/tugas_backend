/**
 * Utility Functions - Common helpers for all views
 * Version: 2.1 - FIXED
 */

// ==================== AUTHENTICATION ====================

async function checkAuth(requiredRole = null, redirectUrl = '/login') {
    var token = localStorage.getItem('token');
    var jabatan = localStorage.getItem('jabatan');
    var username = localStorage.getItem('username');

    console.log('[CHECK AUTH] ====================');
    console.log('[CHECK AUTH] Token:', token ? 'ADA' : 'TIDAK ADA');
    console.log('[CHECK AUTH] localStorage:', { jabatan, username });
    console.log('[CHECK AUTH] requiredRole:', requiredRole);

    if (!token || !jabatan || !username) {
        console.log('[CHECK AUTH] ⚠️ Tidak ada token atau data user!');
        showToast('⚠️ Silakan login terlebih dahulu!', 'error', 3000);
        setTimeout(function() {
            window.location.href = redirectUrl;
        }, 1000);
        return false;
    }

    // Verifikasi token ke server
    try {
        var me = await apiService.getMe();
        console.log('[CHECK AUTH] Server verify:', me);

        // Update localStorage jika ada perubahan
        if (me) {
            localStorage.setItem('jabatan', me.jabatan);
            localStorage.setItem('username', me.username);
            localStorage.setItem('nama', me.nama || me.username);
        }
    } catch (err) {
        console.log('[CHECK AUTH] ❌ Token invalid:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('jabatan');
        localStorage.removeItem('username');
        localStorage.removeItem('nama');
        localStorage.removeItem('user_id');
        showToast('⚠️ Sesi telah berakhir. Silakan login ulang.', 'error', 3000);
        setTimeout(function() {
            window.location.href = redirectUrl;
        }, 1000);
        return false;
    }

    // Cek role
    if (requiredRole && jabatan !== requiredRole) {
        console.log('[CHECK AUTH] ❌ Role tidak sesuai:', { required: requiredRole, actual: jabatan });
        showToast('⚠️ Akses ditolak! Halaman ini untuk ' + requiredRole, 'error', 3000);
        setTimeout(function() {
            window.location.href = redirectUrl;
        }, 1000);
        return false;
    }

    console.log('[CHECK AUTH] ✅ Berhasil! User:', username, 'Role:', jabatan);
    return true;
}

async function logout() {
    try {
        await apiService.logout();
    } catch (err) {
        console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('jabatan');
    localStorage.removeItem('username');
    localStorage.removeItem('nama');
    localStorage.removeItem('user_id');
    localStorage.removeItem('login_time');
    window.location.href = '/login';
}

function getUsername(defaultValue = 'User') {
    return localStorage.getItem('username') || defaultValue;
}

function getRole(defaultValue = null) {
    return localStorage.getItem('jabatan') || defaultValue;
}

function isLoggedIn() {
    return !!localStorage.getItem('username') && !!localStorage.getItem('jabatan');
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info', duration = 4000) {
    // Hapus toast yang sudah ada
    const existing = document.querySelector('.toast-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        max-width: 450px;
        min-width: 280px;
        pointer-events: none;
    `;

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.style.cssText = `
        background: ${colors[type] || '#1e293b'};
        color: white;
        padding: 14px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        margin-bottom: 10px;
        animation: toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-weight: 500;
        font-size: 0.95rem;
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(8px);
    `;
    
    toast.innerHTML = `
        <i class="${icons[type] || icons.info}" style="font-size: 1.2rem;"></i>
        <span style="flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: rgba(255,255,255,0.7);
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0 4px;
            transition: 0.2s;
        ">&times;</button>
    `;

    container.appendChild(toast);
    document.body.appendChild(container);

    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => container.remove(), 300);
    }, duration);

    if (!document.getElementById('toastStyles')) {
        const style = document.createElement('style');
        style.id = 'toastStyles';
        style.textContent = `
            @keyframes toastSlideIn {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes toastSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(120%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function showError(message, elementId = null) {
    if (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = `
                <div class="error-message" style="
                    background: #fee2e2;
                    color: #b91c1c;
                    padding: 12px 16px;
                    border-radius: 12px;
                    margin-top: 10px;
                    border-left: 4px solid #b91c1c;
                ">
                    <i class="fas fa-exclamation-circle"></i> ${escapeHtml(message)}
                </div>
            `;
        }
    }
    showToast(message, 'error');
    console.error(message);
}

function showSuccess(message, elementId = null) {
    if (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = `
                <div class="success-message" style="
                    background: #dcfce7;
                    color: #15803d;
                    padding: 12px 16px;
                    border-radius: 12px;
                    margin-top: 10px;
                    border-left: 4px solid #15803d;
                ">
                    <i class="fas fa-check-circle"></i> ${escapeHtml(message)}
                </div>
            `;
        }
    }
    showToast(message, 'success');
    console.log(message);
}

function showInfo(message) {
    showToast(message, 'info');
}

function showWarning(message) {
    showToast(message, 'warning');
}

// ==================== LOADING STATES ====================

function showLoading(container, message = 'Memuat data...') {
    const el = typeof container === 'string' 
        ? document.getElementById(container) 
        : container;
    
    if (!el) return;
    
    el.innerHTML = `
        <div class="loading-spinner" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: #64748b;
        ">
            <div class="spinner" style="
                width: 40px;
                height: 40px;
                border: 4px solid #e2e8f0;
                border-top-color: #2c7da0;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin-bottom: 12px;
            "></div>
            <p><i class="fas fa-spinner fa-spin"></i> ${escapeHtml(message)}</p>
        </div>
    `;
    
    if (!document.getElementById('spinnerStyles')) {
        const style = document.createElement('style');
        style.id = 'spinnerStyles';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function hideLoading(container) {
    const el = typeof container === 'string' 
        ? document.getElementById(container) 
        : container;
    
    if (el) {
        const spinner = el.querySelector('.loading-spinner');
        if (spinner) spinner.remove();
    }
}

// ==================== FORMATTING ====================

function formatCurrency(value, currency = 'IDR') {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || !isFinite(num)) return 'Rp0';
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

function formatDate(date, locale = 'id-ID') {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(d);
}

function formatDateTime(date, locale = 'id-ID') {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}

function formatTime(date) {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(d);
}

function formatRelativeTime(date) {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    
    const intervals = [
        { label: 'tahun', seconds: 31536000 },
        { label: 'bulan', seconds: 2592000 },
        { label: 'minggu', seconds: 604800 },
        { label: 'hari', seconds: 86400 },
        { label: 'jam', seconds: 3600 },
        { label: 'menit', seconds: 60 },
        { label: 'detik', seconds: 1 }
    ];
    
    for (const interval of intervals) {
        const count = Math.floor(diff / interval.seconds);
        if (count >= 1) {
            return count + ' ' + interval.label + ' yang lalu';
        }
    }
    
    return 'Baru saja';
}

// ==================== STRING HELPERS ====================

// Helper: potong ObjectId (24 hex chars) jadi 8 chars + "..."
function shortId(id) {
    if (!id || typeof id !== 'string') return id || '-';
    if (id.length <= 8) return id;
    return id.substring(0, 8) + '...';
}

function escapeHtml(str) {
    if (!str) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(str).replace(/[&<>"']/g, function(m) {
        return map[m];
    });
}

function truncateText(str, length = 50) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

function capitalizeWords(str) {
    if (!str) return '';
    return String(str).replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
}

// ==================== MODAL HELPERS ====================

function showModal(id, config) {
    let modal = document.getElementById(id);
    if (modal) {
        modal.remove();
    }
    
    modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.5);
        backdrop-filter: blur(4px);
        justify-content: center;
        align-items: center;
    `;
    document.body.appendChild(modal);
    
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeModal(id);
        }
    };
    
    var fieldsHtml = '';
    if (config.fields && config.fields.length) {
        config.fields.forEach(function(f) {
            var idAttr = id + '_' + f.name;
            var inputHtml = '';
            
            if (f.type === 'textarea') {
                inputHtml = '<textarea id="' + idAttr + '" ' + (f.required ? 'required' : '') + ' ' + (f.placeholder ? 'placeholder="' + escapeHtml(f.placeholder) + '"' : '') + ' rows="' + (f.rows || 3) + '" style="width:100%;padding:10px 14px;border:1px solid #cbdde6;border-radius:12px;font-size:0.9rem;font-family:inherit;"></textarea>';
            } else if (f.type === 'select') {
                var optionsHtml = '<option value="">Pilih...</option>';
                if (f.options && f.options.length) {
                    f.options.forEach(function(opt) {
                        optionsHtml += '<option value="' + opt.value + '">' + escapeHtml(opt.label) + '</option>';
                    });
                }
                inputHtml = '<select id="' + idAttr + '" ' + (f.required ? 'required' : '') + ' style="width:100%;padding:10px 14px;border:1px solid #cbdde6;border-radius:12px;font-size:0.9rem;">' + optionsHtml + '</select>';
            } else {
                inputHtml = '<input type="' + (f.type || 'text') + '" id="' + idAttr + '" ' + (f.required ? 'required' : '') + ' ' + (f.placeholder ? 'placeholder="' + escapeHtml(f.placeholder) + '"' : '') + ' ' + (f.min !== undefined ? 'min="' + f.min + '"' : '') + ' ' + (f.max !== undefined ? 'max="' + f.max + '"' : '') + ' ' + (f.step !== undefined ? 'step="' + f.step + '"' : '') + ' style="width:100%;padding:10px 14px;border:1px solid #cbdde6;border-radius:12px;font-size:0.9rem;">';
            }
            
            fieldsHtml += `
                <div class="form-group" style="margin-bottom:16px;">
                    <label for="${idAttr}" style="display:block;margin-bottom:6px;font-weight:500;font-size:0.85rem;color:#1e4a6e;">${escapeHtml(f.label)}</label>
                    ${inputHtml}
                    ${f.help ? '<small style="color:#6c8eae;font-size:0.75rem;">' + escapeHtml(f.help) + '</small>' : ''}
                </div>
            `;
        });
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            margin: auto;
            padding: 32px;
            width: 90%;
            max-width: 520px;
            border-radius: 32px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            border: 1px solid #e2edf2;
            max-height: 90vh;
            overflow-y: auto;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h2 style="font-size:1.4rem;font-weight:600;color:#1e4a6e;border-left:4px solid #2c7da0;padding-left:16px;margin:0;">
                    ${config.icon ? '<i class="fas ' + config.icon + '"></i> ' : ''}${escapeHtml(config.title || 'Form')}
                </h2>
                <span class="close" onclick="closeModal('${id}')" style="font-size:28px;cursor:pointer;color:#8ba3bc;transition:0.2s;line-height:1;">&times;</span>
            </div>
            <form id="${id}Form" onsubmit="return false;">
                ${fieldsHtml}
                <div style="display:flex;gap:12px;margin-top:8px;">
                    <button type="submit" class="btn-submit" style="
                        flex:1;
                        background: #2c7da0;
                        color: white;
                        padding: 12px;
                        border: none;
                        border-radius: 40px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: 0.2s;
                    ">
                        <i class="fas fa-save"></i> ${escapeHtml(config.submitText || 'Simpan')}
                    </button>
                    <button type="button" onclick="closeModal('${id}')" style="
                        padding: 12px 24px;
                        background: #f1f5f9;
                        border: none;
                        border-radius: 40px;
                        font-weight: 500;
                        cursor: pointer;
                        color: #475569;
                        transition: 0.2s;
                    ">
                        <i class="fas fa-times"></i> Batal
                    </button>
                </div>
            </form>
        </div>
    `;
    
    var form = document.getElementById(id + 'Form');
    if (form && config.onSubmit) {
        form.onsubmit = function(e) {
            e.preventDefault();
            
            var data = {};
            if (config.fields) {
                config.fields.forEach(function(f) {
                    var el = document.getElementById(id + '_' + f.name);
                    if (el) {
                        data[f.name] = el.value;
                    }
                });
            }
            
            var result = config.onSubmit(data);
            if (result && result.then) {
                result.catch(function(err) {});
            }
        };
    }
    
    if (config.onOpen) {
        config.onOpen();
    }
    
    openModal(id);
}

function openModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        console.warn('Modal dengan ID "' + id + '" tidak ditemukan');
    }
}

function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ==================== DEBOUNCE ====================

function debounce(func, delay = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==================== CONFIRMATION ====================

function confirmAction(message, title = 'Konfirmasi') {
    return new Promise(function(resolve) {
        if (window.confirm(message)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

// ==================== EXPORT ====================

window.utils = {
    checkAuth: checkAuth,
    logout: logout,
    getUsername: getUsername,
    getRole: getRole,
    isLoggedIn: isLoggedIn,
    showToast: showToast,
    showError: showError,
    showSuccess: showSuccess,
    showInfo: showInfo,
    showWarning: showWarning,
    showLoading: showLoading,
    hideLoading: hideLoading,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    formatTime: formatTime,
    formatRelativeTime: formatRelativeTime,
    escapeHtml: escapeHtml,
    truncateText: truncateText,
    capitalizeWords: capitalizeWords,
    showModal: showModal,
    openModal: openModal,
    closeModal: closeModal,
    debounce: debounce,
    throttle: throttle,
    confirmAction: confirmAction
};

window.checkAuth = checkAuth;
window.logout = logout;
window.getUsername = getUsername;
window.getRole = getRole;
window.isLoggedIn = isLoggedIn;
window.showToast = showToast;
window.showError = showError;
window.showSuccess = showSuccess;
window.showInfo = showInfo;
window.showWarning = showWarning;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatTime = formatTime;
window.formatRelativeTime = formatRelativeTime;
window.escapeHtml = escapeHtml;
window.truncateText = truncateText;
window.capitalizeWords = capitalizeWords;
window.showModal = showModal;
window.openModal = openModal;
window.closeModal = closeModal;
window.debounce = debounce;
window.throttle = throttle;
window.confirmAction = confirmAction;

console.log('✅ utils.js loaded - Version 2.1');