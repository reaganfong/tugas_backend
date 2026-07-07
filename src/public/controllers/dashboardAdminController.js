/**
 * Admin Dashboard Controller - VERSI MODAL FORM DENGAN FONT AWESOME
 * FULL CODE - SEMUA FITUR BERJALAN DENGAN BAIK
 */

document.addEventListener('DOMContentLoaded', function() {
    var username = localStorage.getItem('username') || 'Admin';

    var namaUser = document.getElementById('namaUser');
    if (namaUser) namaUser.innerText = username;

    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            utils.logout();
        };
    }

    console.log('[DEBUG] DOM Ready, memanggil loadAllData...');
    loadAllData();
    setupPasienEvents();
    setupBayiEvents();
    setupCheckupEvents();
    setupDokterEvents();
    setupRuanganEvents();
    setupStaffEvents();

    // Setup pagination untuk jadwal dan checkout
    setupJadwalPagination();
    setupCheckoutPagination();
});

// ==================== HELPER ====================

// Helper: potong ObjectId (24 hex chars) jadi 8 chars + "..."
function shortId(id) {
    if (!id || typeof id !== 'string') return id || '-';
    if (id.length <= 8) return id;
    return id.substring(0, 8) + '...';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return map[m];
    });
}

function formatCurrency(value) {
    var num = parseFloat(value) || 0;
    return 'Rp' + num.toLocaleString('id-ID');
}

function formatDate(date) {
    if (!date) return '-';
    var d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(date) {
    if (!date) return '-';
    var d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type) {
    var toast = document.createElement('div');
    var icon = type === 'success' 
        ? '<i class="fas fa-check-circle"></i> ' 
        : '<i class="fas fa-exclamation-circle"></i> ';
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 24px;border-radius:8px;color:white;z-index:99999;font-weight:500;' + 
        (type === 'success' ? 'background:var(--btn-success);' : 'background:var(--btn-danger);');
    toast.innerHTML = icon + message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
}

// ==================== MODAL SYSTEM ====================

function openModal(title, fields, data, onSave) {
    var existing = document.getElementById('editModal');
    if (existing) existing.remove();
    
    var overlay = document.createElement('div');
    overlay.id = 'editModal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99998;display:flex;justify-content:center;align-items:center;';
    
    var box = document.createElement('div');
    box.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;';
    
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid var(--btn-primary);padding-bottom:10px;';
    header.innerHTML = '<h2 style="margin:0;color:var(--text-secondary);"><i class="fas fa-edit"></i> ' + title + '</h2><span onclick="closeModal()" style="font-size:24px;cursor:pointer;color:var(--text-muted);">&times;</span>';
    box.appendChild(header);
    
    var form = document.createElement('form');
    form.id = 'editForm';
    
    fields.forEach(function(field) {
        var value = data[field.name] !== undefined && data[field.name] !== null ? data[field.name] : '';
        
        var group = document.createElement('div');
        group.style.cssText = 'margin-bottom:15px;';
        
        var label = document.createElement('label');
        label.style.cssText = 'display:block;font-weight:600;margin-bottom:5px;font-size:14px;color:var(--text-secondary);';
        label.textContent = field.label;
        group.appendChild(label);
        
        var input;
        if (field.type === 'select') {
            input = document.createElement('select');
            input.style.cssText = 'width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;';
            field.options.forEach(function(opt) {
                var option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (opt.value == value) option.selected = true;
                input.appendChild(option);
            });
        } else if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.style.cssText = 'width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;min-height:60px;resize:vertical;';
            input.value = value;
        } else {
            input = document.createElement('input');
            input.type = field.type || 'text';
            input.style.cssText = 'width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;';
            input.value = value;

            if (field.min !== undefined) {
                input.min = field.min;
            }
            if (field.max !== undefined) {
                input.max = field.max;
            }
            if (field.step) {
                input.step = field.step;
            }
        }
        input.id = 'field_' + field.name;
        if (field.required) input.required = true;
        group.appendChild(input);
        
        form.appendChild(group);
    });
    
    var btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display:flex;gap:12px;margin-top:8px;';
    
    var saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.style.cssText = 'flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
    btnGroup.appendChild(saveBtn);
    
    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.style.cssText = 'padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Batal';
    cancelBtn.onclick = function() {
        closeModal();
    };
    btnGroup.appendChild(cancelBtn);
    
    form.appendChild(btnGroup);
    
    form.onsubmit = function(e) {
        e.preventDefault();
        
        var formData = {};
        fields.forEach(function(field) {
            var el = document.getElementById('field_' + field.name);
            formData[field.name] = el ? el.value : '';
        });
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        onSave(formData, function() {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
            closeModal();
        }, function(err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
            showToast('Error: ' + err.message, 'error');
        });
    };
    
    box.appendChild(form);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function closeModal() {
    var modal = document.getElementById('editModal');
    if (modal) {
        modal.remove();
    }
}

// ==================== LOAD ALL DATA ====================

async function loadAllData() {
    console.log('[DEBUG] loadAllData dimulai...');
    try {
        await loadPasien();
        await loadBayi();
        await loadJadwalCheckup();    
        await loadSudahCheckout();    
        await loadDokter();
        await loadRuangan();
        await loadStaff();
        await loadShiftJadwal();
        await loadNotifikasi();
        await updateSummaryCards();
        console.log('[DEBUG] loadAllData selesai!');
    } catch (err) {
        console.error('Error:', err);
        showToast('Gagal load data: ' + err.message, 'error');
    }
}

// ==================== UPDATE SUMMARY CARDS ====================
async function updateSummaryCards() {
    try {
        const result = await apiService.getPasienFiltered('', '', 1, 1);
        const totalPasien = result.pagination?.total || 0;
        
        const [ruangan, checkup, dokter, staff, bayi] = await Promise.all([
            apiService.getRuanganStatus(),
            apiService.getCheckup(),
            apiService.getDokter(),
            apiService.getStaff(),
            apiService.getBayi()
        ]);
        
        const elPasien = document.getElementById('summaryPasien');
        if (elPasien) elPasien.innerText = totalPasien;
        
        const totalRuangan = ruangan.length;
        console.log('[DEBUG] Ruangan data:', JSON.stringify(ruangan.map(function(r) { return { id: r.id_ruangan, nama: r.nama_ruangan, status: r.status, ditempati: r.ditempati }; })));
        const terisiRuangan = ruangan.filter(function(r) { return r.status === 'terisi' || (r.ditempati !== null && r.ditempati !== undefined); }).length;
        console.log('[DEBUG] Ruangan terisi:', terisiRuangan, '/ total:', totalRuangan);
        const elRuangan = document.getElementById('summaryRuangan');
        if (elRuangan) elRuangan.innerText = terisiRuangan + ' / ' + totalRuangan;
        
        const elCheckup = document.getElementById('summaryCheckup');
        if (elCheckup) elCheckup.innerText = checkup.length;
        
        const elDokter = document.getElementById('summaryDokter');
        if (elDokter) elDokter.innerText = dokter.length;
        
        const elStaff = document.getElementById('summaryStaff');
        if (elStaff) elStaff.innerText = staff.length;
        
        const elBayi = document.getElementById('summaryBayi');
        if (elBayi) {
            elBayi.innerText = bayi.length;
        }
        
    } catch (err) {
        console.error('Error update summary:', err);
    }
}

// ==================== LOAD PASIEN ====================

let pasienState = {
    search: '',
    status: '',
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
};

async function loadPasien() {
    var container = document.getElementById('pasien-container');
    if (!container) {
        console.error('[ERROR] pasien-container tidak ditemukan!');
        return;
    }
    
    var search = document.getElementById('searchPasienInput')?.value || '';
    var status = document.getElementById('filterStatusPasien')?.value || '';
    
    console.log('[ADMIN] Filter status:', status);  // TAMBAHKAN LOG
    
    pasienState.search = search;
    pasienState.status = status;
    
    try {
        container.style.transition = 'opacity 0.2s ease';
        container.style.opacity = '0.3';
        
        var result = await apiService.getPasienFiltered(
            pasienState.search,
            pasienState.status,
            pasienState.page,
            pasienState.limit
        );
        
        var data = result.data || [];
        var pagination = result.pagination || { total: 0, totalPages: 0 };
        
        pasienState.total = pagination.total;
        pasienState.totalPages = pagination.totalPages;
        
        var countEl = document.getElementById('pasienCount');
        if (countEl) countEl.innerText = pagination.total || 0;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);"><i class="fas fa-info-circle"></i> Tidak ada data pasien.</div>';
            updatePaginationInfo();
            container.style.opacity = '1';
            return;
        }
        
        var html = '<div class="table-responsive"><table class="data-table">';
        html += '<thead><tr>';
        html += '<th>Nama</th><th>Nama Wali</th><th>No Telp</th><th>Penyakit</th><th>Umur</th><th>JK</th><th>Status</th><th>Aksi</th>';
        html += '</tr></thead><tbody>';
        
        data.forEach(function(p) {
            var statusDisplay = '';
            if (p.msh_dirawat === 'baru') {
                statusDisplay = '<span class="badge badge-info">Baru</span>';
            } else if (p.msh_dirawat === 'dirawat') {
                statusDisplay = '<span class="badge badge-warning">Dirawat</span>';
            } else if (p.msh_dirawat === 'pulang') {
                statusDisplay = '<span class="badge badge-success">Pulang</span>';
            } else {
                statusDisplay = p.msh_dirawat || '-';
            }
            
            var jk = p.jenis_kelamin === 'L' ? 'Laki-laki' : p.jenis_kelamin === 'P' ? 'Perempuan' : '-';
            var penyakit = p.nama_penyakit || '-';
            
            html += '<tr>';
            html += '<td>' + escapeHtml(p.nama || '-') + '</td>';
            html += '<td>' + escapeHtml(p.nama_wali || '-') + '</td>';
            html += '<td>' + escapeHtml(p.no_telp_pasien || '-') + '</td>';
            html += '<td>' + escapeHtml(penyakit) + '</td>';
            html += '<td>' + (p.umur || '-') + '</td>';
            html += '<td>' + jk + '</td>';
            html += '<td>' + statusDisplay + '</td>';
            html += '<td>';
            html += '<div class="action-buttons">';
            html += '<button class="btn-edit" onclick="editPasien(\'' + p.id_pasien + '\')"><i class="fas fa-edit"></i> Edit</button>';
            html += '<button class="btn-delete" onclick="hapusPasien(\'' + p.id_pasien + '\', \'' + escapeHtml(p.nama) + '\')"><i class="fas fa-trash"></i> Hapus</button>';
            html += '</div>';
            html += '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        updatePaginationInfo();
        
        setTimeout(function() {
            container.style.opacity = '1';
        }, 150);
        
    } catch (err) {
        container.style.opacity = '1';
        console.error('[ERROR] loadPasien error:', err);
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + err.message + '</div>';
    }
}

function updatePaginationInfo() {
    var total = pasienState.total || 0;
    var page = pasienState.page || 1;
    var limit = pasienState.limit || 10;
    
    var from = total > 0 ? (page - 1) * limit + 1 : 0;
    var to = total > 0 ? Math.min(page * limit, total) : 0;
    
    document.getElementById('paginationFrom').innerText = from;
    document.getElementById('paginationTo').innerText = to;
    document.getElementById('paginationTotal').innerText = total;
    document.getElementById('pageInfo').innerText = 'Halaman ' + page + ' dari ' + (pasienState.totalPages || 1);
    
    var prevBtn = document.getElementById('prevPageBtn');
    var nextBtn = document.getElementById('nextPageBtn');
    
    if (prevBtn) prevBtn.disabled = page <= 1 || total === 0;
    if (nextBtn) nextBtn.disabled = page >= pasienState.totalPages || total === 0;
}

function setupPasienEvents() {
    console.log('[DEBUG] setupPasienEvents dipanggil...');
    
    var btnSearch = document.getElementById('btnSearchPasien');
    var btnReset = document.getElementById('btnResetPasien');
    var searchInput = document.getElementById('searchPasienInput');
    var prevBtn = document.getElementById('prevPageBtn');
    var nextBtn = document.getElementById('nextPageBtn');
    var limitSelect = document.getElementById('limitSelect');
    
    if (btnSearch) {
        btnSearch.addEventListener('click', function() {
            pasienState.page = 1;
            loadPasien();
        });
    }
    
    if (btnReset) {
        btnReset.addEventListener('click', function() {
            var input = document.getElementById('searchPasienInput');
            var filter = document.getElementById('filterStatusPasien');
            if (input) input.value = '';
            if (filter) filter.value = '';
            pasienState.page = 1;
            loadPasien();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                pasienState.page = 1;
                loadPasien();
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (pasienState.page > 1) {
                pasienState.page--;
                loadPasien();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (pasienState.page < pasienState.totalPages) {
                pasienState.page++;
                loadPasien();
            }
        });
    }
    
    if (limitSelect) {
        limitSelect.addEventListener('change', function() {
            pasienState.limit = parseInt(this.value) || 10;
            pasienState.page = 1;
            loadPasien();
        });
    }
}

// ==================== LOAD BAYI ====================

let bayiState = {
    search: '',
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
};

async function loadBayi() {
    var container = document.getElementById('bayi-container');
    if (!container) return;
    
    var search = document.getElementById('searchBayiInput')?.value || '';
    bayiState.search = search;
    
    try {
        container.style.transition = 'opacity 0.2s ease';
        container.style.opacity = '0.3';
        
        var result = await apiService.getBayiFiltered(
            bayiState.search,
            bayiState.page,
            bayiState.limit
        );
        
        var data = result.data || [];
        var pagination = result.pagination || { total: 0, totalPages: 0 };
        
        bayiState.total = pagination.total;
        bayiState.totalPages = pagination.totalPages;
        
        var countEl = document.getElementById('bayiCount');
        if (countEl) countEl.innerText = pagination.total || 0;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);"><i class="fas fa-info-circle"></i> Tidak ada data bayi.</div>';
            updateBayiPaginationInfo();
            container.style.opacity = '1';
            return;
        }
        
        var html = '<div class="table-responsive"><table class="data-table">';
        html += '<thead><tr>';
        html += '<th>Nama Bayi</th><th>Nama Ibu</th><th>JK</th><th>Berat</th><th>Tinggi</th><th>Aksi</th>';
        html += '</tr></thead><tbody>';
        
        data.forEach(function(b) {
            var jk = b.jenis_kelamin === 'L' ? 'Laki-laki' : b.jenis_kelamin === 'P' ? 'Perempuan' : '-';
            
            html += '<tr>';
            html += '<td>' + escapeHtml(b.nama_bayi || '-') + '</td>';
            html += '<td>' + escapeHtml(b.nama_ibu || '-') + '</td>';
            html += '<td>' + jk + '</td>';
            html += '<td>' + (b.berat || '-') + '</td>';
            html += '<td>' + (b.tinggi || '-') + '</td>';
            html += '<td>';
            html += '<div class="action-buttons">';
            html += '<button class="btn-edit" onclick="editBayi(\'' + b.id_bayi + '\')"><i class="fas fa-edit"></i> Edit</button>';
            html += '<button class="btn-delete" onclick="hapusBayi(\'' + b.id_bayi + '\', \'' + escapeHtml(b.nama_bayi || 'Bayi') + '\')"><i class="fas fa-trash"></i> Hapus</button>';
            html += '</div>';
            html += '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        updateBayiPaginationInfo();
        
        setTimeout(function() {
            container.style.opacity = '1';
        }, 150);
        
    } catch (err) {
        container.style.opacity = '1';
        console.error('[ERROR] loadBayi error:', err);
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + err.message + '</div>';
    }
}

function updateBayiPaginationInfo() {
    var total = bayiState.total || 0;
    var page = bayiState.page || 1;
    var limit = bayiState.limit || 5;
    
    var from = total > 0 ? (page - 1) * limit + 1 : 0;
    var to = total > 0 ? Math.min(page * limit, total) : 0;
    
    document.getElementById('bayiPaginationFrom').innerText = from;
    document.getElementById('bayiPaginationTo').innerText = to;
    document.getElementById('bayiPaginationTotal').innerText = total;
    document.getElementById('bayiPageInfo').innerText = 'Halaman ' + page + ' dari ' + (bayiState.totalPages || 1);
    
    var prevBtn = document.getElementById('bayiPrevPage');
    var nextBtn = document.getElementById('bayiNextPage');
    
    if (prevBtn) prevBtn.disabled = page <= 1 || total === 0;
    if (nextBtn) nextBtn.disabled = page >= bayiState.totalPages || total === 0;
}

function setupBayiEvents() {
    var btnSearch = document.getElementById('btnSearchBayi');
    var btnReset = document.getElementById('btnResetBayi');
    var searchInput = document.getElementById('searchBayiInput');
    var prevBtn = document.getElementById('bayiPrevPage');
    var nextBtn = document.getElementById('bayiNextPage');
    var limitSelect = document.getElementById('bayiLimit');
    
    if (btnSearch) {
        btnSearch.addEventListener('click', function() {
            bayiState.page = 1;
            loadBayi();
        });
    }
    
    if (btnReset) {
        btnReset.addEventListener('click', function() {
            var input = document.getElementById('searchBayiInput');
            if (input) input.value = '';
            bayiState.page = 1;
            loadBayi();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                bayiState.page = 1;
                loadBayi();
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (bayiState.page > 1) {
                bayiState.page--;
                loadBayi();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (bayiState.page < bayiState.totalPages) {
                bayiState.page++;
                loadBayi();
            }
        });
    }
    
    if (limitSelect) {
        limitSelect.addEventListener('change', function() {
            bayiState.limit = parseInt(this.value) || 5;
            bayiState.page = 1;
            loadBayi();
        });
    }
}

// ==================== STATE JADWAL CHECKUP ====================
let jadwalState = {
    data: [],
    search: '',
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
};

// ==================== STATE SUDAH CHECKOUT ====================
let checkoutState = {
    data: [],
    search: '',
    status: '',
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
};

// ==================== LOAD JADWAL CHECKUP ====================
async function loadJadwalCheckup() {
    var container = document.getElementById('jadwal-checkup-container');
    if (!container) return;
    
    var search = document.getElementById('searchJadwalInput')?.value || '';
    jadwalState.search = search;
    
    try {
        container.style.opacity = '0.3';
        container.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
        
        var allData = await apiService.getJadwalCheckup();
        console.log('[ADMIN] Jadwal Checkup:', allData);
        
        var data = allData || [];
        jadwalState.data = data;
        jadwalState.total = data.length;
        jadwalState.totalPages = Math.ceil(jadwalState.total / jadwalState.limit);
        
        var countEl = document.getElementById('jadwalCheckupCount');
        if (countEl) countEl.innerText = jadwalState.total;
        
        renderJadwalPage();
        updateJadwalPagination();
        
        setTimeout(function() {
            container.style.opacity = '1';
        }, 150);
        
    } catch (err) {
        container.style.opacity = '1';
        console.error('[ERROR] loadJadwalCheckup:', err);
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + err.message + '</div>';
    }
}

function renderJadwalPage() {
    var container = document.getElementById('jadwal-checkup-container');
    if (!container) return;
    
    var data = jadwalState.data;
    var page = jadwalState.page;
    var limit = jadwalState.limit;
    
    var start = (page - 1) * limit;
    var end = Math.min(start + limit, data.length);
    var pageData = data.slice(start, end);
    
    if (pageData.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:30px;color:var(--text-muted);">
                <i class="fas fa-calendar-check" style="font-size:2rem;display:block;margin-bottom:12px;color:var(--text-light);"></i>
                Tidak ada jadwal checkup
            </div>
        `;
        return;
    }
    
    var html = '<div class="table-responsive"><table class="data-table">';
    html += '<thead><tr>';
    html += '<th>Pasien</th><th>Dokter</th><th>Tanggal</th><th>Jam</th><th>Biaya</th><th>Keterangan</th><th>Aksi</th>';
    html += '</tr></thead><tbody>';
    
    pageData.forEach(function(c) {
        html += '<tr>';
        html += '<td>' + escapeHtml(c.nama_pasien || '-') + '</td>';
        html += '<td>' + escapeHtml(c.nama_dokter || '-') + '</td>';
        html += '<td>' + formatDate(c.tanggal) + '</td>';
        html += '<td>' + (c.jam || '-') + '</td>';
        html += '<td>' + formatCurrency(c.biaya_checkup || 0) + '</td>';
        html += '<td>' + escapeHtml(c.keterangan || '-') + '</td>';
        html += '<td>';
        html += '<div class="action-buttons">';
        html += '<button class="btn-edit" onclick="editCheckup(\'' + c.id_checkup + '\')"><i class="fas fa-edit"></i> Edit</button>';
        html += '<button class="btn-batal" onclick="batalCheckup(\'' + c.id_checkup + '\')" style="background:var(--btn-warning);color:white;border:none;padding:4px 12px;border-radius:20px;font-size:0.7rem;cursor:pointer;margin-left:4px;"><i class="fas fa-times"></i> Batal</button>';
        html += '</div>';
        html += '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function updateJadwalPagination() {
    var total = jadwalState.total || 0;
    var page = jadwalState.page || 1;
    var limit = jadwalState.limit || 5;
    
    var from = total > 0 ? (page - 1) * limit + 1 : 0;
    var to = total > 0 ? Math.min(page * limit, total) : 0;
    
    document.getElementById('jadwalFrom').innerText = from;
    document.getElementById('jadwalTo').innerText = to;
    document.getElementById('jadwalTotal').innerText = total;
    document.getElementById('jadwalPageInfo').innerText = 'Halaman ' + page + ' dari ' + (jadwalState.totalPages || 1);
    
    var prevBtn = document.getElementById('jadwalPrevPage');
    var nextBtn = document.getElementById('jadwalNextPage');
    
    if (prevBtn) prevBtn.disabled = page <= 1 || total === 0;
    if (nextBtn) nextBtn.disabled = page >= jadwalState.totalPages || total === 0;
}

function setupJadwalPagination() {
    var prevBtn = document.getElementById('jadwalPrevPage');
    var nextBtn = document.getElementById('jadwalNextPage');
    var limitSelect = document.getElementById('jadwalLimit');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (jadwalState.page > 1) {
                jadwalState.page--;
                renderJadwalPage();
                updateJadwalPagination();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (jadwalState.page < jadwalState.totalPages) {
                jadwalState.page++;
                renderJadwalPage();
                updateJadwalPagination();
            }
        });
    }
    
    if (limitSelect) {
        limitSelect.addEventListener('change', function() {
            jadwalState.limit = parseInt(this.value) || 5;
            jadwalState.page = 1;
            jadwalState.totalPages = Math.ceil(jadwalState.total / jadwalState.limit);
            renderJadwalPage();
            updateJadwalPagination();
        });
    }
}

// ==================== LOAD SUDAH CHECKOUT ====================
async function loadSudahCheckout() {
    var container = document.getElementById('sudah-checkout-container');
    if (!container) return;
    
    var search = document.getElementById('searchCheckoutInput')?.value || '';
    var status = document.getElementById('filterStatusCheckout')?.value || '';
    
    checkoutState.search = search;
    checkoutState.status = status;
    
    try {
        container.style.opacity = '0.3';
        container.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
        
        var allData = await apiService.getSudahCheckout();
        console.log('[ADMIN] Sudah Checkout:', allData);
        
        var data = allData || [];
        
        if (status) {
            data = data.filter(function(c) { return c.status === status; });
        }
        
        if (search) {
            var keyword = search.toLowerCase();
            data = data.filter(function(c) {
                return (c.nama_pasien || '').toLowerCase().includes(keyword) || 
                       (c.nama_dokter || '').toLowerCase().includes(keyword);
            });
        }
        
        checkoutState.data = data;
        checkoutState.total = data.length;
        checkoutState.totalPages = Math.ceil(checkoutState.total / checkoutState.limit);
        
        var countEl = document.getElementById('sudahCheckoutCount');
        if (countEl) countEl.innerText = checkoutState.total;
        
        renderCheckoutPage();
        updateCheckoutPagination();
        
        setTimeout(function() {
            container.style.opacity = '1';
        }, 150);
        
    } catch (err) {
        container.style.opacity = '1';
        console.error('[ERROR] loadSudahCheckout:', err);
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + err.message + '</div>';
    }
}

function renderCheckoutPage() {
    var container = document.getElementById('sudah-checkout-container');
    if (!container) return;
    
    var data = checkoutState.data;
    var page = checkoutState.page;
    var limit = checkoutState.limit;
    
    var start = (page - 1) * limit;
    var end = Math.min(start + limit, data.length);
    var pageData = data.slice(start, end);
    
    if (pageData.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:30px;color:var(--text-muted);">
                <i class="fas fa-clock" style="font-size:2rem;display:block;margin-bottom:12px;color:var(--text-light);"></i>
                Belum ada data checkout
            </div>
        `;
        return;
    }
    
    var html = '<div class="table-responsive"><table class="data-table">';
    html += '<thead><tr>';
    html += '<th>Pasien</th><th>Dokter</th><th>Tanggal</th><th>Jam</th><th>Checkout</th><th>Status</th><th>Biaya</th><th>Keterangan</th>';
    html += '</tr></thead><tbody>';
    
    pageData.forEach(function(c) {
        var statusBadge = '';
        if (c.status === 'selesai') {
            statusBadge = '<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:0.7rem;font-weight:600;background:var(--badge-success-bg);color:var(--badge-success-text);"><i class="fas fa-check-circle" style="margin-right:4px;"></i> Selesai</span>';
        } else if (c.status === 'batal') {
            statusBadge = '<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:0.7rem;font-weight:600;background:var(--badge-danger-bg);color:var(--badge-danger-text);"><i class="fas fa-times-circle" style="margin-right:4px;"></i> Batal</span>';
        } else {
            statusBadge = c.status || '-';
        }
        
        var checkout = c.checkout ? formatDateTime(c.checkout) : '-';
        
        html += '<tr>';
        html += '<td>' + escapeHtml(c.nama_pasien || '-') + '</td>';
        html += '<td>' + escapeHtml(c.nama_dokter || '-') + '</td>';
        html += '<td>' + formatDate(c.tanggal) + '</td>';
        html += '<td>' + (c.jam || '-') + '</td>';
        html += '<td>' + checkout + '</td>';
        html += '<td>' + statusBadge + '</td>';
        html += '<td>' + formatCurrency(c.biaya_checkup || 0) + '</td>';
        html += '<td>' + escapeHtml(c.keterangan || '-') + '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function updateCheckoutPagination() {
    var total = checkoutState.total || 0;
    var page = checkoutState.page || 1;
    var limit = checkoutState.limit || 5;
    
    var from = total > 0 ? (page - 1) * limit + 1 : 0;
    var to = total > 0 ? Math.min(page * limit, total) : 0;
    
    document.getElementById('checkoutFrom').innerText = from;
    document.getElementById('checkoutTo').innerText = to;
    document.getElementById('checkoutTotal').innerText = total;
    document.getElementById('checkoutPageInfo').innerText = 'Halaman ' + page + ' dari ' + (checkoutState.totalPages || 1);
    
    var prevBtn = document.getElementById('checkoutPrevPage');
    var nextBtn = document.getElementById('checkoutNextPage');
    
    if (prevBtn) prevBtn.disabled = page <= 1 || total === 0;
    if (nextBtn) nextBtn.disabled = page >= checkoutState.totalPages || total === 0;
}

function setupCheckoutPagination() {
    var prevBtn = document.getElementById('checkoutPrevPage');
    var nextBtn = document.getElementById('checkoutNextPage');
    var limitSelect = document.getElementById('checkoutLimit');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (checkoutState.page > 1) {
                checkoutState.page--;
                renderCheckoutPage();
                updateCheckoutPagination();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (checkoutState.page < checkoutState.totalPages) {
                checkoutState.page++;
                renderCheckoutPage();
                updateCheckoutPagination();
            }
        });
    }
    
    if (limitSelect) {
        limitSelect.addEventListener('change', function() {
            checkoutState.limit = parseInt(this.value) || 5;
            checkoutState.page = 1;
            checkoutState.totalPages = Math.ceil(checkoutState.total / checkoutState.limit);
            renderCheckoutPage();
            updateCheckoutPagination();
        });
    }
}

// ==================== BATAL CHECKUP ====================
async function batalCheckup(id) {
    if (!confirm('Yakin ingin membatalkan checkup ini?')) return;
    
    try {
        await apiService.batalCheckup(id);
        showToast('Checkup berhasil dibatalkan!', 'success');
        loadJadwalCheckup();
        updateSummaryCards();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ==================== SETUP CHECKUP EVENTS ====================
function setupCheckupEvents() {
    var btnSearchJadwal = document.getElementById('btnSearchJadwal');
    var btnResetJadwal = document.getElementById('btnResetJadwal');
    var searchJadwalInput = document.getElementById('searchJadwalInput');
    
    if (btnSearchJadwal) {
        btnSearchJadwal.addEventListener('click', function() {
            jadwalState.page = 1;
            loadJadwalCheckup();
        });
    }
    
    if (btnResetJadwal) {
        btnResetJadwal.addEventListener('click', function() {
            if (searchJadwalInput) searchJadwalInput.value = '';
            jadwalState.page = 1;
            loadJadwalCheckup();
        });
    }
    
    if (searchJadwalInput) {
        searchJadwalInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('btnSearchJadwal')?.click();
            }
        });
    }
    
    var btnSearchCheckout = document.getElementById('btnSearchCheckout');
    var btnResetCheckout = document.getElementById('btnResetCheckout');
    var searchCheckoutInput = document.getElementById('searchCheckoutInput');
    var filterStatusCheckout = document.getElementById('filterStatusCheckout');
    
    if (btnSearchCheckout) {
        btnSearchCheckout.addEventListener('click', function() {
            checkoutState.page = 1;
            loadSudahCheckout();
        });
    }
    
    if (btnResetCheckout) {
        btnResetCheckout.addEventListener('click', function() {
            if (searchCheckoutInput) searchCheckoutInput.value = '';
            if (filterStatusCheckout) filterStatusCheckout.value = '';
            checkoutState.page = 1;
            loadSudahCheckout();
        });
    }
    
    if (searchCheckoutInput) {
        searchCheckoutInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('btnSearchCheckout')?.click();
            }
        });
    }
    
    if (filterStatusCheckout) {
        filterStatusCheckout.addEventListener('change', function() {
            checkoutState.page = 1;
            loadSudahCheckout();
        });
    }
}

// ==================== LOAD DOKTER ====================

let dokterState = {
    search: '',
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
};

async function loadDokter() {
    var container = document.getElementById('dokter-container');
    if (!container) return;
    
    var search = document.getElementById('searchDokterInput')?.value || '';
    dokterState.search = search;
    
    try {
        container.style.transition = 'opacity 0.2s ease';
        container.style.opacity = '0.3';
        
        var result = await apiService.getDokterFiltered(
            dokterState.search,
            dokterState.page,
            dokterState.limit
        );
        
        var data = result.data || [];
        var pagination = result.pagination || { total: 0, totalPages: 0 };
        
        dokterState.total = pagination.total;
        dokterState.totalPages = pagination.totalPages;
        
        var countEl = document.getElementById('dokterCount');
        if (countEl) countEl.innerText = pagination.total || 0;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);"><i class="fas fa-info-circle"></i> Tidak ada data dokter.</div>';
            updateDokterPaginationInfo();
            container.style.opacity = '1';
            return;
        }
        
        var html = '<div class="table-responsive"><table class="data-table">';
        html += '<thead><tr>';
        html += '<th>Nama</th><th>Spesialisasi</th><th>Umur</th><th>No Telepon</th><th>Honor</th><th>Aksi</th>';
        html += '</tr></thead><tbody>';
        
        data.forEach(function(d) {
            html += '<tr>';
            html += '<td>' + escapeHtml(d.nama_dokter || '-') + '</td>';
            html += '<td>' + escapeHtml(d.spesialisasi || '-') + '</td>';
            html += '<td>' + (d.umur || '-') + '</td>';
            html += '<td>' + escapeHtml(d.no_telepon || '-') + '</td>';
            html += '<td>' + formatCurrency(d.biaya_honor || 0) + '</td>';
            html += '<td>';
            html += '<div class="action-buttons">';
            html += '<button class="btn-edit" onclick="editDokter(\'' + d.id_dokter + '\')"><i class="fas fa-edit"></i> Edit</button>';
            html += '<button class="btn-delete" onclick="hapusDokter(\'' + d.id_dokter + '\', \'' + escapeHtml(d.nama_dokter) + '\')"><i class="fas fa-trash"></i> Hapus</button>';
            html += '</div>';
            html += '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        updateDokterPaginationInfo();
        
        setTimeout(function() {
            container.style.opacity = '1';
        }, 150);
        
    } catch (err) {
        container.style.opacity = '1';
        console.error('[ERROR] loadDokter error:', err);
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + err.message + '</div>';
    }
}

function updateDokterPaginationInfo() {
    var total = dokterState.total || 0;
    var page = dokterState.page || 1;
    var limit = dokterState.limit || 10;
    
    var from = total > 0 ? (page - 1) * limit + 1 : 0;
    var to = total > 0 ? Math.min(page * limit, total) : 0;
    
    document.getElementById('dokterPaginationFrom').innerText = from;
    document.getElementById('dokterPaginationTo').innerText = to;
    document.getElementById('dokterPaginationTotal').innerText = total;
    document.getElementById('dokterPageInfo').innerText = 'Halaman ' + page + ' dari ' + (dokterState.totalPages || 1);
    
    var prevBtn = document.getElementById('dokterPrevPage');
    var nextBtn = document.getElementById('dokterNextPage');
    
    if (prevBtn) prevBtn.disabled = page <= 1 || total === 0;
    if (nextBtn) nextBtn.disabled = page >= dokterState.totalPages || total === 0;
}

function setupDokterEvents() {
    var btnSearch = document.getElementById('btnSearchDokter');
    var btnReset = document.getElementById('btnResetDokter');
    var searchInput = document.getElementById('searchDokterInput');
    var prevBtn = document.getElementById('dokterPrevPage');
    var nextBtn = document.getElementById('dokterNextPage');
    var limitSelect = document.getElementById('dokterLimit');
    
    if (btnSearch) {
        btnSearch.addEventListener('click', function() {
            dokterState.page = 1;
            loadDokter();
        });
    }
    
    if (btnReset) {
        btnReset.addEventListener('click', function() {
            var input = document.getElementById('searchDokterInput');
            if (input) input.value = '';
            dokterState.page = 1;
            loadDokter();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                dokterState.page = 1;
                loadDokter();
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (dokterState.page > 1) {
                dokterState.page--;
                loadDokter();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (dokterState.page < dokterState.totalPages) {
                dokterState.page++;
                loadDokter();
            }
        });
    }
    
    if (limitSelect) {
        limitSelect.addEventListener('change', function() {
            dokterState.limit = parseInt(this.value) || 10;
            dokterState.page = 1;
            loadDokter();
        });
    }
}

// ==================== LOAD RUANGAN ====================

let ruanganState = {
    search: '',
    status: '',
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
};

async function loadRuangan() {
    var container = document.getElementById('ruangan-container');
    if (!container) {
        console.error('[ERROR] ruangan-container tidak ditemukan!');
        return;
    }
    
    var search = document.getElementById('searchRuanganInput')?.value || '';
    var status = document.getElementById('filterStatusRuangan')?.value || '';
    
    ruanganState.search = search;
    ruanganState.status = status;
    
    try {
        container.style.transition = 'opacity 0.2s ease';
        container.style.opacity = '0.3';
        
        var result = await apiService.getRuanganFiltered(
            ruanganState.search,
            ruanganState.status,
            ruanganState.page,
            ruanganState.limit
        );
        
        console.log('[DEBUG] Ruangan result:', result);
        
        var data = result.data || [];
        var pagination = result.pagination || { total: 0, totalPages: 0 };
        
        ruanganState.total = pagination.total;
        ruanganState.totalPages = pagination.totalPages;
        
        var countEl = document.getElementById('ruanganCount');
        if (countEl) countEl.innerText = pagination.total || 0;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);"><i class="fas fa-info-circle"></i> Tidak ada data ruangan.</div>';
            updateRuanganPaginationInfo();
            container.style.opacity = '1';
            return;
        }
        
        var html = '<div class="table-responsive"><table class="data-table">';
        html += '<thead><tr>';
        html += '<th>Nama Ruangan</th><th>Nomor</th><th>Pasien</th><th>Lama Inap</th><th>Harga/Hari</th><th>Status</th><th>Aksi</th>';
        html += '</tr></thead><tbody>';
        
        data.forEach(function(r) {
            var statusBadge = r.status === 'terisi' 
                ? '<span class="badge badge-danger">Terisi</span>'
                : '<span class="badge badge-success">Kosong</span>';
            
            var lamaInap = '-';
            if (r.status === 'terisi' && r.lama_inap) {
                lamaInap = r.lama_inap + ' hari';
            } else if (r.status === 'terisi' && r.tanggal_checkin) {
                var checkin = new Date(r.tanggal_checkin);
                var now = new Date();
                var diffDays = Math.ceil(Math.abs(now - checkin) / (1000 * 60 * 60 * 24));
                lamaInap = diffDays + ' hari';
            }
            
            var hargaPerHari = r.biaya_per_hari ? formatCurrency(r.biaya_per_hari) : '-';
            
            html += '<tr>';
            html += '<td>' + escapeHtml(r.nama_ruangan || '-') + '</td>';
            html += '<td>' + (r.nomor_ruangan || '-') + '</td>';
            html += '<td>' + escapeHtml(r.nama_pasien || '-') + '</td>';
            html += '<td>' + lamaInap + '</td>';
            html += '<td>' + hargaPerHari + '</td>';
            html += '<td>' + statusBadge + '</td>';
            html += '<td>';
            html += '<div class="action-buttons">';
            html += '<button class="btn-edit" onclick="editRuangan(\'' + r.id_ruangan + '\')"><i class="fas fa-edit"></i> Edit</button>';
            html += '<button class="btn-delete" onclick="hapusRuangan(\'' + r.id_ruangan + '\', \'' + escapeHtml(r.nama_ruangan) + '\')"><i class="fas fa-trash"></i> Hapus</button>';
            html += '</div>';
            html += '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        updateRuanganPaginationInfo();
        
        setTimeout(function() {
            container.style.opacity = '1';
        }, 150);
        
    } catch (err) {
        container.style.opacity = '1';
        console.error('[ERROR] loadRuangan error:', err);
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + err.message + '</div>';
    }
}

function updateRuanganPaginationInfo() {
    var total = ruanganState.total || 0;
    var page = ruanganState.page || 1;
    var limit = ruanganState.limit || 5;
    
    var from = total > 0 ? (page - 1) * limit + 1 : 0;
    var to = total > 0 ? Math.min(page * limit, total) : 0;
    
    document.getElementById('ruanganPaginationFrom').innerText = from;
    document.getElementById('ruanganPaginationTo').innerText = to;
    document.getElementById('ruanganPaginationTotal').innerText = total;
    document.getElementById('ruanganPageInfo').innerText = 'Halaman ' + page + ' dari ' + (ruanganState.totalPages || 1);
    
    var prevBtn = document.getElementById('ruanganPrevPage');
    var nextBtn = document.getElementById('ruanganNextPage');
    
    if (prevBtn) prevBtn.disabled = page <= 1 || total === 0;
    if (nextBtn) nextBtn.disabled = page >= ruanganState.totalPages || total === 0;
}

function setupRuanganEvents() {
    var btnSearch = document.getElementById('btnSearchRuangan');
    var btnReset = document.getElementById('btnResetRuangan');
    var searchInput = document.getElementById('searchRuanganInput');
    var statusFilter = document.getElementById('filterStatusRuangan');
    var prevBtn = document.getElementById('ruanganPrevPage');
    var nextBtn = document.getElementById('ruanganNextPage');
    var limitSelect = document.getElementById('ruanganLimit');
    
    if (btnSearch) {
        btnSearch.addEventListener('click', function() {
            ruanganState.page = 1;
            loadRuangan();
        });
    }
    
    if (btnReset) {
        btnReset.addEventListener('click', function() {
            var input = document.getElementById('searchRuanganInput');
            var filter = document.getElementById('filterStatusRuangan');
            if (input) input.value = '';
            if (filter) filter.value = '';
            ruanganState.page = 1;
            loadRuangan();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                ruanganState.page = 1;
                loadRuangan();
            }
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            ruanganState.page = 1;
            loadRuangan();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (ruanganState.page > 1) {
                ruanganState.page--;
                loadRuangan();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (ruanganState.page < ruanganState.totalPages) {
                ruanganState.page++;
                loadRuangan();
            }
        });
    }
    
    if (limitSelect) {
        limitSelect.addEventListener('change', function() {
            ruanganState.limit = parseInt(this.value) || 5;
            ruanganState.page = 1;
            loadRuangan();
        });
    }
}

// ==================== LOAD STAFF ====================

let staffState = {
    search: '',
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
};

async function loadStaff() {
    var container = document.getElementById('staff-container');
    if (!container) return;
    
    var search = document.getElementById('searchStaffInput')?.value || '';
    staffState.search = search;
    
    try {
        container.style.transition = 'opacity 0.2s ease';
        container.style.opacity = '0.3';
        
        var result = await apiService.getStaffFiltered(
            staffState.search,
            staffState.page,
            staffState.limit
        );
        
        var data = result.data || [];
        var pagination = result.pagination || { total: 0, totalPages: 0 };
        
        staffState.total = pagination.total;
        staffState.totalPages = pagination.totalPages;
        
        var countEl = document.getElementById('staffCount');
        if (countEl) countEl.innerText = pagination.total || 0;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);"><i class="fas fa-info-circle"></i> Tidak ada data staff.</div>';
            updateStaffPaginationInfo();
            container.style.opacity = '1';
            return;
        }
        
        var html = '<div class="table-responsive"><table class="data-table">';
        html += '<thead><tr>';
        html += '<th>Nama</th><th>Jabatan</th><th>No Telepon</th><th>Gaji</th><th>Aksi</th>';
        html += '</tr></thead><tbody>';
        
        data.forEach(function(s) {
            html += '<tr>';
            html += '<td>' + escapeHtml(s.nama_staff || '-') + '</td>';
            html += '<td>' + escapeHtml(s.jabatan || '-') + '</td>';
            html += '<td>' + escapeHtml(s.no_telepon || '-') + '</td>';
            html += '<td>' + formatCurrency(s.gaji || 0) + '</td>';
            html += '<td>';
            html += '<div class="action-buttons">';
            html += '<button class="btn-edit" onclick="editStaff(\'' + s.id_staff + '\')"><i class="fas fa-edit"></i> Edit</button>';
            html += '<button class="btn-delete" onclick="hapusStaff(\'' + s.id_staff + '\', \'' + escapeHtml(s.nama_staff) + '\')"><i class="fas fa-trash"></i> Hapus</button>';
            html += '</div>';
            html += '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        updateStaffPaginationInfo();
        
        setTimeout(function() {
            container.style.opacity = '1';
        }, 150);
        
    } catch (err) {
        container.style.opacity = '1';
        console.error('[ERROR] loadStaff error:', err);
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + err.message + '</div>';
    }
}

function updateStaffPaginationInfo() {
    var total = staffState.total || 0;
    var page = staffState.page || 1;
    var limit = staffState.limit || 10;
    
    var from = total > 0 ? (page - 1) * limit + 1 : 0;
    var to = total > 0 ? Math.min(page * limit, total) : 0;
    
    document.getElementById('staffPaginationFrom').innerText = from;
    document.getElementById('staffPaginationTo').innerText = to;
    document.getElementById('staffPaginationTotal').innerText = total;
    document.getElementById('staffPageInfo').innerText = 'Halaman ' + page + ' dari ' + (staffState.totalPages || 1);
    
    var prevBtn = document.getElementById('staffPrevPage');
    var nextBtn = document.getElementById('staffNextPage');
    
    if (prevBtn) prevBtn.disabled = page <= 1 || total === 0;
    if (nextBtn) nextBtn.disabled = page >= staffState.totalPages || total === 0;
}

function setupStaffEvents() {
    var btnSearch = document.getElementById('btnSearchStaff');
    var btnReset = document.getElementById('btnResetStaff');
    var searchInput = document.getElementById('searchStaffInput');
    var prevBtn = document.getElementById('staffPrevPage');
    var nextBtn = document.getElementById('staffNextPage');
    var limitSelect = document.getElementById('staffLimit');
    
    if (btnSearch) {
        btnSearch.addEventListener('click', function() {
            staffState.page = 1;
            loadStaff();
        });
    }
    
    if (btnReset) {
        btnReset.addEventListener('click', function() {
            var input = document.getElementById('searchStaffInput');
            if (input) input.value = '';
            staffState.page = 1;
            loadStaff();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                staffState.page = 1;
                loadStaff();
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (staffState.page > 1) {
                staffState.page--;
                loadStaff();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (staffState.page < staffState.totalPages) {
                staffState.page++;
                loadStaff();
            }
        });
    }
    
    if (limitSelect) {
        limitSelect.addEventListener('change', function() {
            staffState.limit = parseInt(this.value) || 10;
            staffState.page = 1;
            loadStaff();
        });
    }
}

// ==================== LOAD SHIFT ====================

async function loadShiftJadwal() {
    console.log('[INFO] loadShiftJadwal dipanggil...');
    
    const staffContainer = document.getElementById('shift-staff-container');
    const usersContainer = document.getElementById('shift-users-container');
    
    if (!staffContainer || !usersContainer) {
        console.error('[ERROR] Container shift tidak ditemukan!');
        return;
    }
    
    try {
        staffContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat shift staff...';
        usersContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat shift users...';
        
        const data = await apiService.get('/admin/shift');
        console.log('[DATA] Shift:', data);
        
        const staffShifts = data.staff || [];
        const userShifts = data.users || [];
        
        if (staffShifts.length === 0) {
            staffContainer.innerHTML = '<p style="color:var(--text-muted);"><i class="fas fa-info-circle"></i> Tidak ada data shift staff.</p>';
        } else {
            let html = `
                <table class="shift-table">
                    <thead>
                        <tr>
                            <th class="col-id">No</th>
                            <th class="col-name">Nama</th>
                            <th class="col-day">Hari</th>
                            <th class="col-shift">Shift</th>
                            <th class="col-action">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            staffShifts.forEach(function(s, idx) {
                html += `
                    <tr>
                        <td class="col-id">${idx + 1}</td>
                        <td class="col-name">${escapeHtml(s.nama_staff || '-')}</td>
                        <td class="col-day"><span class="badge badge-info">${s.hari}</span></td>
                        <td class="col-shift"><span class="badge badge-secondary">${s.shift}</span></td>
                        <td class="col-action">
                            <button class="btn-edit" onclick="editShiftStaff('${s.id_staff}', '${s.hari}', '${s.shift}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
                <p class="shift-total">
                    <i class="fas fa-info-circle"></i> Total: ${staffShifts.length} data
                </p>
            `;
            
            staffContainer.innerHTML = html;
        }
        
        if (userShifts.length === 0) {
            usersContainer.innerHTML = '<p style="color:var(--text-muted);"><i class="fas fa-info-circle"></i> Tidak ada data shift users.</p>';
        } else {
            let html = `
                <table class="shift-table">
                    <thead>
                        <tr>
                            <th class="col-id">No</th>
                            <th class="col-name">Username</th>
                            <th class="col-day">Hari</th>
                            <th class="col-shift">Shift</th>
                            <th class="col-action">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            userShifts.forEach(function(u, idx) {
                html += `
                    <tr>
                        <td class="col-id">${idx + 1}</td>
                        <td class="col-name">${escapeHtml(u.username || '-')}</td>
                        <td class="col-day"><span class="badge badge-info">${u.hari}</span></td>
                        <td class="col-shift"><span class="badge badge-secondary">${u.shift}</span></td>
                        <td class="col-action">
                            <button class="btn-edit" onclick="editShiftUser('${u.id}', '${u.hari}', '${u.shift}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
                <p class="shift-total">
                    <i class="fas fa-info-circle"></i> Total: ${userShifts.length} data
                </p>
            `;
            
            usersContainer.innerHTML = html;
        }
        
    } catch (err) {
        console.error('[ERROR] loadShiftJadwal:', err);
        staffContainer.innerHTML = '<p style="color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + err.message + '</p>';
        usersContainer.innerHTML = '<p style="color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + err.message + '</p>';
    }
}

// ==================== LOAD NOTIFIKASI ====================

async function loadNotifikasi() {
    var container = document.getElementById('notifikasi-container');
    if (!container) return;
    
    try {
        var data = await apiService.getNotifikasiDarurat();
        
        var countEl = document.getElementById('notifCount');
        if (countEl) countEl.innerText = data.length;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<i class="fas fa-check-circle"></i> Tidak ada notifikasi baru.';
            return;
        }
        
        var html = '<div class="table-responsive"><table class="data-table">';
        html += '<thead><tr>';
        html += '<th>No</th><th>Jenis</th><th>Pesan</th><th>Tanggal</th><th>Aksi</th>';
        html += '</tr></thead><tbody>';
        
        data.forEach(function(n, idx) {
            var jenisIcon = n.jenis === 'fasilitas_rusak' 
                ? '<i class="fas fa-tools"></i>'
                : n.jenis === 'obat_dibuang'
                ? '<i class="fas fa-trash"></i>'
                : '<i class="fas fa-bell"></i>';
            
            html += '<tr>';
            html += '<td>' + (idx + 1) + '</td>';
            html += '<td>' + jenisIcon + ' ' + escapeHtml(n.jenis || '-') + '</td>';
            html += '<td>' + escapeHtml(n.pesan || '-') + '</td>';
            html += '<td>' + formatDate(n.tanggal) + '</td>';
            html += '<td><button class="btn-edit" onclick="markNotifikasiRead(\'' + n.id_notif + '\')" style="background:var(--btn-success);color:white;"><i class="fas fa-check"></i> Tandai Dibaca</button></td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
    } catch (err) {
        container.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error: ' + err.message;
        console.error(err);
    }
}

function markNotifikasiRead(id) {
    apiService.markNotifikasiRead(id)
        .then(function() {
            showToast('Notifikasi ditandai sudah dibaca!', 'success');
            loadNotifikasi();
        })
        .catch(function(err) {
            showToast('Error: ' + err.message, 'error');
        });
}

// ==================== EDIT SHIFT STAFF ====================

function editShiftStaff(id, currentHari, currentShift) {
    apiService.getShiftJadwal()
        .then(function(data) {
            var staffShifts = data.staff || [];
            var userShifts = staffShifts.filter(function(s) { return s.id_staff === id; });
            var selectedDays = userShifts.map(function(s) { return s.hari; });
            
            var staffName = '';
            if (userShifts.length > 0 && userShifts[0].nama_staff) {
                staffName = userShifts[0].nama_staff;
            } else {
                apiService.getStaff()
                    .then(function(staffData) {
                        var staff = staffData.find(function(s) { return s.id_staff === id; });
                        if (staff) {
                            staffName = staff.nama_staff || '';
                            var infoDiv = document.querySelector('#editModal .staff-info');
                            if (infoDiv) {
                                infoDiv.innerHTML = '<i class="fas fa-user"></i> Staff: <strong>' + escapeHtml(staffName) + '</strong> (ID: ' + id + ')';
                            }
                        }
                    })
                    .catch(function(err) {
                        console.error('Error getting staff name:', err);
                    });
            }
            
            var overlay = document.createElement('div');
            overlay.id = 'editModal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99998;display:flex;justify-content:center;align-items:center;';
            
            var box = document.createElement('div');
            box.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;';
            
            var header = document.createElement('div');
            header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid var(--btn-primary);padding-bottom:10px;';
            header.innerHTML = '<h2 style="margin:0;color:var(--text-secondary);"><i class="fas fa-edit"></i> Edit Shift Staff</h2><span onclick="closeModal()" style="font-size:24px;cursor:pointer;color:var(--text-muted);">&times;</span>';
            box.appendChild(header);
            
            var info = document.createElement('div');
            info.className = 'staff-info';
            info.style.cssText = 'background:var(--bg-table-header);padding:10px 14px;border-radius:8px;margin-bottom:16px;color:var(--text-secondary);';
            
            if (staffName) {
                info.innerHTML = '<i class="fas fa-user"></i> Staff: <strong>' + escapeHtml(staffName) + '</strong> (ID: ' + id + ')';
            } else {
                info.innerHTML = '<i class="fas fa-user"></i> Staff ID: <strong>' + id + '</strong> <span style="color:var(--text-light);font-size:0.8rem;">(Memuat nama...)</span>';
            }
            box.appendChild(info);
            
            var shiftGroup = document.createElement('div');
            shiftGroup.style.cssText = 'margin-bottom:15px;';
            shiftGroup.innerHTML = `
                <label style="display:block;font-weight:600;margin-bottom:5px;font-size:14px;color:var(--text-secondary);">Shift *</label>
                <select id="edit_shift" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;">
                    <option value="Shift I" ${currentShift === 'Shift I' ? 'selected' : ''}>Shift I</option>
                    <option value="Shift II" ${currentShift === 'Shift II' ? 'selected' : ''}>Shift II</option>
                    <option value="Shift III" ${currentShift === 'Shift III' ? 'selected' : ''}>Shift III</option>
                </select>
            `;
            box.appendChild(shiftGroup);
            
            var hariGroup = document.createElement('div');
            hariGroup.style.cssText = 'margin-bottom:15px;';
            hariGroup.innerHTML = `
                <label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;color:var(--text-secondary);">
                    <i class="fas fa-calendar-alt"></i> Hari (centang lebih dari satu) *
                </label>
                <div id="hari_checkboxes" style="display:flex;flex-wrap:wrap;gap:10px;">
                    ${['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(function(h) {
                        var checked = selectedDays.includes(h) ? 'checked' : '';
                        return `
                            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 12px;background:${checked ? 'var(--badge-info-bg)' : 'var(--bg-secondary)'};border-radius:8px;border:1px solid ${checked ? 'var(--btn-primary)' : 'var(--border-light)'};">
                                <input type="checkbox" value="${h}" ${checked} style="width:16px;height:16px;cursor:pointer;">
                                ${h}
                            </label>
                        `;
                    }).join('')}
                </div>
                <small style="color:var(--text-muted);font-size:0.75rem;">Pilih satu atau lebih hari</small>
            `;
            box.appendChild(hariGroup);
            
            var btnGroup = document.createElement('div');
            btnGroup.style.cssText = 'display:flex;gap:12px;margin-top:8px;';
            btnGroup.innerHTML = `
                <button id="saveShiftBtn" style="flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-save"></i> Simpan Perubahan
                </button>
                <button onclick="closeModal()" style="padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);">
                    <i class="fas fa-times"></i> Batal
                </button>
            `;
            box.appendChild(btnGroup);
            
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            
            document.querySelectorAll('#hari_checkboxes input[type="checkbox"]').forEach(function(cb) {
                cb.addEventListener('change', function() {
                    var label = this.closest('label');
                    if (this.checked) {
                        label.style.background = 'var(--badge-info-bg)';
                        label.style.borderColor = 'var(--btn-primary)';
                    } else {
                        label.style.background = 'var(--bg-secondary)';
                        label.style.borderColor = 'var(--border-light)';
                    }
                });
            });
            
            document.getElementById('saveShiftBtn').addEventListener('click', function() {
                var shift = document.getElementById('edit_shift').value;
                var checkboxes = document.querySelectorAll('#hari_checkboxes input[type="checkbox"]:checked');
                var hari = [];
                checkboxes.forEach(function(cb) { hari.push(cb.value); });
                
                if (hari.length === 0) {
                    showToast('Pilih minimal 1 hari!', 'error');
                    return;
                }
                
                var btn = this;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
                
                apiService.request('/admin/shift/staff', {
                    method: 'PUT',
                    body: { id_staff: id, hari: hari, shift: shift }
                })
                .then(function() {
                    showToast('Shift staff berhasil diupdate!', 'success');
                    closeModal();
                    loadShiftJadwal();
                })
                .catch(function(err) {
                    showToast('Error: ' + err.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
                });
            });
            
            if (!staffName) {
                apiService.getStaff()
                    .then(function(staffData) {
                        var staff = staffData.find(function(s) { return s.id_staff === id; });
                        if (staff && staff.nama_staff) {
                            var infoDiv = document.querySelector('#editModal .staff-info');
                            if (infoDiv) {
                                infoDiv.innerHTML = '<i class="fas fa-user"></i> Staff: <strong>' + escapeHtml(staff.nama_staff) + '</strong> (ID: ' + id + ')';
                            }
                        }
                    })
                    .catch(function(err) {
                        console.error('Error getting staff name:', err);
                    });
            }
            
        })
        .catch(function(err) {
            showToast('Error: ' + err.message, 'error');
        });
}

// ==================== EDIT SHIFT USER ====================

function editShiftUser(id, currentHari, currentShift) {
    apiService.getShiftJadwal()
        .then(function(data) {
            var userShifts = data.users || [];
            var userShiftsFiltered = userShifts.filter(function(u) { return u.id === id; });
            var selectedDays = userShiftsFiltered.map(function(u) { return u.hari; });
            
            var overlay = document.createElement('div');
            overlay.id = 'editModal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99998;display:flex;justify-content:center;align-items:center;';
            
            var box = document.createElement('div');
            box.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;';
            
            var header = document.createElement('div');
            header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid var(--btn-primary);padding-bottom:10px;';
            header.innerHTML = '<h2 style="margin:0;color:var(--text-secondary);"><i class="fas fa-edit"></i> Edit Shift User</h2><span onclick="closeModal()" style="font-size:24px;cursor:pointer;color:var(--text-muted);">&times;</span>';
            box.appendChild(header);
            
            var info = document.createElement('div');
            info.style.cssText = 'background:var(--bg-table-header);padding:10px 14px;border-radius:8px;margin-bottom:16px;color:var(--text-secondary);';
            info.innerHTML = '<i class="fas fa-user"></i> User ID: <strong>' + id + '</strong>';
            box.appendChild(info);
            
            var shiftGroup = document.createElement('div');
            shiftGroup.style.cssText = 'margin-bottom:15px;';
            shiftGroup.innerHTML = `
                <label style="display:block;font-weight:600;margin-bottom:5px;font-size:14px;color:var(--text-secondary);">Shift *</label>
                <select id="edit_shift_user" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;">
                    <option value="Shift I" ${currentShift === 'Shift I' ? 'selected' : ''}>Shift I</option>
                    <option value="Shift II" ${currentShift === 'Shift II' ? 'selected' : ''}>Shift II</option>
                    <option value="Shift III" ${currentShift === 'Shift III' ? 'selected' : ''}>Shift III</option>
                </select>
            `;
            box.appendChild(shiftGroup);
            
            var hariGroup = document.createElement('div');
            hariGroup.style.cssText = 'margin-bottom:15px;';
            hariGroup.innerHTML = `
                <label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;color:var(--text-secondary);">
                    <i class="fas fa-calendar-alt"></i> Hari (centang lebih dari satu) *
                </label>
                <div id="hari_checkboxes_user" style="display:flex;flex-wrap:wrap;gap:10px;">
                    ${['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(function(h) {
                        var checked = selectedDays.includes(h) ? 'checked' : '';
                        return `
                            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 12px;background:${checked ? 'var(--badge-info-bg)' : 'var(--bg-secondary)'};border-radius:8px;border:1px solid ${checked ? 'var(--btn-primary)' : 'var(--border-light)'};">
                                <input type="checkbox" value="${h}" ${checked} style="width:16px;height:16px;cursor:pointer;">
                                ${h}
                            </label>
                        `;
                    }).join('')}
                </div>
                <small style="color:var(--text-muted);font-size:0.75rem;">Pilih satu atau lebih hari</small>
            `;
            box.appendChild(hariGroup);
            
            var btnGroup = document.createElement('div');
            btnGroup.style.cssText = 'display:flex;gap:12px;margin-top:8px;';
            btnGroup.innerHTML = `
                <button id="saveShiftUserBtn" style="flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-save"></i> Simpan Perubahan
                </button>
                <button onclick="closeModal()" style="padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);">
                    <i class="fas fa-times"></i> Batal
                </button>
            `;
            box.appendChild(btnGroup);
            
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            
            document.querySelectorAll('#hari_checkboxes_user input[type="checkbox"]').forEach(function(cb) {
                cb.addEventListener('change', function() {
                    var label = this.closest('label');
                    if (this.checked) {
                        label.style.background = 'var(--badge-info-bg)';
                        label.style.borderColor = 'var(--btn-primary)';
                    } else {
                        label.style.background = 'var(--bg-secondary)';
                        label.style.borderColor = 'var(--border-light)';
                    }
                });
            });
            
            document.getElementById('saveShiftUserBtn').addEventListener('click', function() {
                var shift = document.getElementById('edit_shift_user').value;
                var checkboxes = document.querySelectorAll('#hari_checkboxes_user input[type="checkbox"]:checked');
                var hari = [];
                checkboxes.forEach(function(cb) { hari.push(cb.value); });
                
                if (hari.length === 0) {
                    showToast('Pilih minimal 1 hari!', 'error');
                    return;
                }
                
                var btn = this;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
                
                apiService.request('/admin/shift/user', {
                    method: 'PUT',
                    body: { id_users: id, hari: hari, shift: shift }
                })
                .then(function() {
                    showToast('Shift user berhasil diupdate!', 'success');
                    closeModal();
                    loadShiftJadwal();
                })
                .catch(function(err) {
                    showToast('Error: ' + err.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
                });
            });
            
        })
        .catch(function(err) {
            showToast('Error: ' + err.message, 'error');
        });
}

// ==================== EDIT PASIEN ====================

function editPasien(id) {
    console.log('editPasien dipanggil dengan ID:', id);
    
    apiService.getPasien()
        .then(function(data) {
            var pasien = data.find(function(p) { return p.id_pasien === id; });
            if (!pasien) {
                showToast('Data tidak ditemukan', 'error');
                return;
            }
            
            var overlay = document.createElement('div');
            overlay.id = 'editModal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99998;display:flex;justify-content:center;align-items:center;';
            
            var box = document.createElement('div');
            box.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:700px;width:95%;max-height:90vh;overflow-y:auto;';
            
            var header = document.createElement('div');
            header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid var(--btn-primary);padding-bottom:10px;';
            header.innerHTML = '<h2 style="margin:0;color:var(--text-secondary);"><i class="fas fa-user-edit"></i> Edit Pasien</h2><span onclick="closeModal()" style="font-size:24px;cursor:pointer;color:var(--text-muted);">&times;</span>';
            box.appendChild(header);
            
            var form = document.createElement('form');
            form.id = 'editPasienForm';
            form.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px 24px;';
            
            var fields = [
                { name: 'nama', label: 'Nama', type: 'text', required: true, col: '1/2' },
                { name: 'nama_wali', label: 'Nama Wali', type: 'text', col: '2/2' },
                { name: 'jenis_penyakit', label: 'Jenis Penyakit', type: 'select', options: ['ringan', 'berat', 'kronis'], col: '1/2' },
                { name: 'nama_penyakit', label: 'Nama Penyakit', type: 'text', col: '2/2' },
                { name: 'umur', label: 'Umur (tahun)', type: 'number', min: 0, col: '1/2' },
                { name: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', options: ['L', 'P'], col: '2/2' },
                { name: 'no_telp_pasien', label: 'No Telp Pasien', type: 'text', col: '1/2' },
                { name: 'no_telp_wali', label: 'No Telp Wali', type: 'text', col: '2/2' },
                { name: 'deskripsi_dokter', label: 'Deskripsi Dokter', type: 'textarea', col: '1/1', full: true }
            ];
            
            fields.forEach(function(field) {
                var value = pasien[field.name] !== undefined && pasien[field.name] !== null ? pasien[field.name] : '';
                
                var group = document.createElement('div');
                group.style.cssText = 'margin-bottom:0;';
                
                if (field.full) {
                    group.style.gridColumn = '1 / -1';
                } else if (field.col === '1/2') {
                    group.style.gridColumn = '1 / 2';
                } else if (field.col === '2/2') {
                    group.style.gridColumn = '2 / 3';
                }
                
                var label = document.createElement('label');
                label.style.cssText = 'display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);';
                label.textContent = field.label + (field.required ? ' *' : '');
                group.appendChild(label);
                
                var input;
                if (field.type === 'select') {
                    input = document.createElement('select');
                    input.style.cssText = 'width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;background:white;';
                    field.options.forEach(function(opt) {
                        var option = document.createElement('option');
                        option.value = opt;
                        option.textContent = opt === 'L' ? 'Laki-laki' : opt === 'P' ? 'Perempuan' : opt;
                        if (opt == value) option.selected = true;
                        input.appendChild(option);
                    });
                } else if (field.type === 'textarea') {
                    input = document.createElement('textarea');
                    input.style.cssText = 'width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;min-height:60px;resize:vertical;font-family:inherit;';
                    input.value = value;
                } else {
                    input = document.createElement('input');
                    input.type = field.type || 'text';
                    input.style.cssText = 'width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;';
                    input.value = value;
                    if (field.min !== undefined) input.min = field.min;
                }
                input.id = 'field_' + field.name;
                if (field.required) input.required = true;
                group.appendChild(input);
                
                form.appendChild(group);
            });
            
            box.appendChild(form);
            
            var btnGroup = document.createElement('div');
            btnGroup.style.cssText = 'display:flex;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color);';
            
            var saveBtn = document.createElement('button');
            saveBtn.type = 'submit';
            saveBtn.style.cssText = 'flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
            btnGroup.appendChild(saveBtn);
            
            var cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.style.cssText = 'padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);font-size:14px;';
            cancelBtn.innerHTML = '<i class="fas fa-times"></i> Batal';
            cancelBtn.onclick = function() { closeModal(); };
            btnGroup.appendChild(cancelBtn);
            
            var btnWrapper = document.createElement('div');
            btnWrapper.style.cssText = 'grid-column:1/-1;';
            btnWrapper.appendChild(btnGroup);
            form.appendChild(btnWrapper);
            
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            
            form.onsubmit = function(e) {
                e.preventDefault();
                
                var formData = {};
                fields.forEach(function(field) {
                    var el = document.getElementById('field_' + field.name);
                    formData[field.name] = el ? el.value : '';
                });
                
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
                
                apiService.updatePasien(id, formData)
                    .then(function() {
                        showToast('Pasien berhasil diupdate!', 'success');
                        closeModal();
                        loadPasien();
                    })
                    .catch(function(err) {
                        showToast('Error: ' + err.message, 'error');
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
                    });
            };
            
            overlay.onclick = function(e) {
                if (e.target === overlay) {
                    closeModal();
                }
            };
            
        })
        .catch(function(err) {
            showToast('Error: ' + err.message, 'error');
        });
}

// ==================== EDIT BAYI ====================

function editBayi(id) {
    apiService.getBayi()
        .then(function(data) {
            var bayi = data.find(function(b) { return b.id_bayi === id; });
            if (!bayi) {
                showToast('Data tidak ditemukan', 'error');
                return;
            }
            
            var fields = [
                { name: 'nama_bayi', label: 'Nama Bayi', type: 'text' },
                { 
                    name: 'jenis_kelamin', 
                    label: 'Jenis Kelamin', 
                    type: 'select',
                    options: [
                        { value: 'L', label: 'Laki-laki' },
                        { value: 'P', label: 'Perempuan' }
                    ]
                },
                { 
                    name: 'berat', 
                    label: 'Berat (kg)', 
                    type: 'number', 
                    min: 0,
                    step: '0.01' 
                },
                { 
                    name: 'tinggi', 
                    label: 'Tinggi (cm)', 
                    type: 'number', 
                    min: 0,
                    step: '0.01' 
                }
            ];
            
            openModal('Edit Bayi', fields, bayi, function(formData, onSuccess, onError) {
                var dataUpdate = {
                    id_ibu: bayi.id_ibu || null,
                    nama_ibu: bayi.nama_ibu || '',
                    nama_bayi: formData.nama_bayi,
                    jenis_kelamin: formData.jenis_kelamin,
                    berat: parseFloat(formData.berat) || null,
                    tinggi: parseFloat(formData.tinggi) || null
                };
                
                apiService.updateBayi(id, dataUpdate)
                    .then(function() {
                        showToast('Bayi berhasil diupdate!', 'success');
                        loadBayi();
                        onSuccess();
                    })
                    .catch(function(err) {
                        onError(err);
                    });
            });
        })
        .catch(function(err) {
            showToast('Error: ' + err.message, 'error');
        });
}

// ==================== EDIT CHECKUP ====================

function editCheckup(id) {
    Promise.all([
        apiService.getCheckup(),
        apiService.getPasien(),
        apiService.getDokter()
    ])
    .then(function(results) {
        var checkups = results[0];
        var patients = results[1] || [];
        var doctors = results[2] || [];
        
        var checkup = checkups.find(function(c) { return c.id_checkup === id; });
        if (!checkup) {
            showToast('Data tidak ditemukan', 'error');
            return;
        }
        
        var pasienData = patients.find(function(p) { return p.id_pasien == checkup.id_pasien; });
        var isPasienDirawat = pasienData && pasienData.msh_dirawat == 1;
        var pasienName = pasienData ? pasienData.nama : 'Unknown';
        
        var overlay = document.createElement('div');
        overlay.id = 'editModal';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99998;display:flex;justify-content:center;align-items:center;';
        
        var box = document.createElement('div');
        box.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:750px;width:95%;max-height:90vh;overflow-y:auto;';
        
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid var(--btn-primary);padding-bottom:10px;';
        header.innerHTML = '<h2 style="margin:0;color:var(--text-secondary);"><i class="fas fa-edit"></i> Edit Checkup</h2><span onclick="closeModal()" style="font-size:24px;cursor:pointer;color:var(--text-muted);">&times;</span>';
        box.appendChild(header);
        
        if (isPasienDirawat) {
            var warningDiv = document.createElement('div');
            warningDiv.style.cssText = 'background:var(--badge-warning-bg);border:1px solid var(--badge-warning-text);border-radius:8px;padding:12px 16px;margin-bottom:16px;color:var(--badge-warning-text);display:flex;align-items:center;gap:10px;';
            warningDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size:1.2rem;color:var(--badge-warning-text);"></i>
                <div>
                    <strong>Perhatian:</strong> Pasien <strong>${escapeHtml(pasienName)}</strong> sedang dirawat inap!
                    <br>
                    <span style="font-size:0.85rem;">Status pasien: <strong>Dirawat</strong>. Pastikan pasien sudah dipulangkan sebelum checkup.</span>
                </div>
            `;
            box.appendChild(warningDiv);
        }
        
        var form = document.createElement('form');
        form.id = 'editCheckupForm';
        form.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px 24px;';
        
        var pasienGroup = document.createElement('div');
        pasienGroup.style.cssText = 'grid-column:1/2;';

        var pasienLabel = document.createElement('label');
        pasienLabel.style.cssText = 'display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);';
        pasienLabel.innerHTML = '<i class="fas fa-user"></i> Cari Pasien *';
        pasienGroup.appendChild(pasienLabel);

        var searchDiv = document.createElement('div');
        searchDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:6px;';
        searchDiv.innerHTML = `
            <input type="text" id="pasienSearchInput" placeholder="Cari nama atau ID pasien..." style="flex:1;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;">
            <button type="button" id="searchPasienBtn" style="background:var(--btn-primary);color:white;border:none;padding:6px 16px;border-radius:8px;cursor:pointer;">Cari</button>
            <button type="button" id="resetPasienBtn" style="background:var(--bg-secondary);color:var(--text-secondary);border:none;padding:6px 16px;border-radius:8px;cursor:pointer;">Reset</button>
        `;
        pasienGroup.appendChild(searchDiv);

        var tableDiv = document.createElement('div');
        tableDiv.style.cssText = 'max-height:150px;overflow-y:auto;border:1px solid var(--border-light);border-radius:8px;';
        tableDiv.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                <thead style="position:sticky;top:0;background:var(--bg-table-header);z-index:2;">
                    <tr>
                        <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border-color);width:15%;">No</th>
                        <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border-color);width:40%;">Nama</th>
                        <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border-color);width:20%;">Status</th>
                        <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border-color);width:25%;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="pasienTableBody">
                    <tr><td colspan="4" style="text-align:center;padding:10px;color:var(--text-muted);">Memuat data pasien...</td></tr>
                </tbody>
            </table>
        `;
        pasienGroup.appendChild(tableDiv);

        var selectedPasienName = '';
        var foundPasien = patients.find(function(p) { return p.id_pasien == checkup.id_pasien; });
        if (foundPasien) {
            selectedPasienName = foundPasien.nama;
        }

        var selectedPasienDiv = document.createElement('div');
        selectedPasienDiv.style.cssText = 'margin-top:8px;padding:8px 12px;background:var(--badge-success-bg);border-radius:8px;border:1px solid var(--badge-success-bg);font-size:0.85rem;';
        selectedPasienDiv.innerHTML = `
            <span style="font-weight:600;color:var(--text-secondary);">Pasien Terpilih:</span>
            <span id="selectedPasienDisplay" style="color:var(--badge-success-text);font-weight:500;">${checkup.id_pasien ? 'ID: ' + checkup.id_pasien + ' - ' + escapeHtml(selectedPasienName || 'Unknown') : 'Belum ada pasien dipilih'}</span>
        `;
        pasienGroup.appendChild(selectedPasienDiv);

        var pasienHidden = document.createElement('input');
        pasienHidden.type = 'hidden';
        pasienHidden.id = 'field_id_pasien';
        pasienHidden.value = checkup.id_pasien || '';
        pasienGroup.appendChild(pasienHidden);

        form.appendChild(pasienGroup);
        
        var dokterGroup = document.createElement('div');
        dokterGroup.style.cssText = 'grid-column:2/3;';

        var dokterLabel = document.createElement('label');
        dokterLabel.style.cssText = 'display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);';
        dokterLabel.innerHTML = '<i class="fas fa-user-md"></i> Cari Dokter *';
        dokterGroup.appendChild(dokterLabel);

        var searchDokterDiv = document.createElement('div');
        searchDokterDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:6px;';
        searchDokterDiv.innerHTML = `
            <input type="text" id="dokterSearchInput" placeholder="Cari nama atau ID dokter..." style="flex:1;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;">
            <button type="button" id="searchDokterBtn" style="background:var(--btn-primary);color:white;border:none;padding:6px 16px;border-radius:8px;cursor:pointer;">Cari</button>
            <button type="button" id="resetDokterBtn" style="background:var(--bg-secondary);color:var(--text-secondary);border:none;padding:6px 16px;border-radius:8px;cursor:pointer;">Reset</button>
        `;
        dokterGroup.appendChild(searchDokterDiv);

        var tableDokterDiv = document.createElement('div');
        tableDokterDiv.style.cssText = 'max-height:150px;overflow-y:auto;border:1px solid var(--border-light);border-radius:8px;';
        tableDokterDiv.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                <thead style="position:sticky;top:0;background:var(--bg-table-header);z-index:2;">
                    <tr>
                        <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border-color);width:15%;">No</th>
                        <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border-color);width:55%;">Nama</th>
                        <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border-color);width:30%;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="dokterTableBody">
                    <tr><td colspan="3" style="text-align:center;padding:10px;color:var(--text-muted);">Memuat data dokter...</td></tr>
                </tbody>
            </table>
        `;
        dokterGroup.appendChild(tableDokterDiv);

        var selectedDokterName = '';
        var foundDokter = doctors.find(function(d) { return d.id_dokter == checkup.id_dokter; });
        if (foundDokter) {
            selectedDokterName = foundDokter.nama_dokter;
        }

        var selectedDokterDiv = document.createElement('div');
        selectedDokterDiv.style.cssText = 'margin-top:8px;padding:8px 12px;background:var(--badge-success-bg);border-radius:8px;border:1px solid var(--badge-success-bg);font-size:0.85rem;';
        selectedDokterDiv.innerHTML = `
            <span style="font-weight:600;color:var(--text-secondary);">Dokter Terpilih:</span>
            <span id="selectedDokterDisplay" style="color:var(--badge-success-text);font-weight:500;">${checkup.id_dokter ? 'ID: ' + checkup.id_dokter + ' - ' + escapeHtml(selectedDokterName || 'Unknown') : 'Belum ada dokter dipilih'}</span>
        `;
        dokterGroup.appendChild(selectedDokterDiv);

        var dokterHidden = document.createElement('input');
        dokterHidden.type = 'hidden';
        dokterHidden.id = 'field_id_dokter';
        dokterHidden.value = checkup.id_dokter || '';
        dokterGroup.appendChild(dokterHidden);

        form.appendChild(dokterGroup);
        
        var tanggalGroup = document.createElement('div');
        tanggalGroup.style.cssText = 'grid-column:1/2;';
        tanggalGroup.innerHTML = `
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);"><i class="fas fa-calendar-alt"></i> Tanggal *</label>
            <input type="date" id="field_tanggal" value="${checkup.tanggal || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;" required>
        `;
        form.appendChild(tanggalGroup);
        
        var jamGroup = document.createElement('div');
        jamGroup.style.cssText = 'grid-column:2/3;';
        jamGroup.innerHTML = `
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);"><i class="fas fa-clock"></i> Jam *</label>
            <input type="time" id="field_jam" value="${checkup.jam || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;" required>
        `;
        form.appendChild(jamGroup);
        
        var statusGroup = document.createElement('div');
        statusGroup.style.cssText = 'grid-column:1/2;';
        var statusLabel = document.createElement('label');
        statusLabel.style.cssText = 'display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);';
        statusLabel.innerHTML = '<i class="fas fa-tag"></i> Status';
        statusGroup.appendChild(statusLabel);
        
        var statusSelect = document.createElement('select');
        statusSelect.id = 'field_status';
        statusSelect.style.cssText = 'width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;background:white;';
        
        var statusOptions = ['terjadwal', 'batal'];
        statusOptions.forEach(function(opt) {
            var option = document.createElement('option');
            option.value = opt;
            option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
            if (opt == checkup.status) {
                option.selected = true;
            }
            statusSelect.appendChild(option);
        });
        statusGroup.appendChild(statusSelect);
        form.appendChild(statusGroup);
        
        var biayaGroup = document.createElement('div');
        biayaGroup.style.cssText = 'grid-column:2/3;';
        biayaGroup.innerHTML = `
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);"><i class="fas fa-money-bill-wave"></i> Biaya Checkup (Rp)</label>
            <input type="number" id="field_biaya_checkup" value="${checkup.biaya_checkup || 0}" min="0" step="1000" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;">
        `;
        form.appendChild(biayaGroup);
        
        var keteranganGroup = document.createElement('div');
        keteranganGroup.style.cssText = 'grid-column:1/-1;';
        keteranganGroup.innerHTML = `
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);"><i class="fas fa-comment"></i> Keterangan</label>
            <textarea id="field_keterangan" rows="2" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;min-height:60px;resize:vertical;font-family:inherit;">${checkup.keterangan || ''}</textarea>
        `;
        form.appendChild(keteranganGroup);
        
        box.appendChild(form);
        
        var btnWrapper = document.createElement('div');
        btnWrapper.style.cssText = 'grid-column:1/-1;display:flex;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color);';
        
        var saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.style.cssText = 'flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;';
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
        btnWrapper.appendChild(saveBtn);
        
        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.style.cssText = 'padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);font-size:14px;';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Batal';
        cancelBtn.onclick = function() { closeModal(); };
        btnWrapper.appendChild(cancelBtn);
        
        form.appendChild(btnWrapper);
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        function renderPasienTable(keyword) {
            var tbody = document.getElementById('pasienTableBody');
            if (!tbody) return;
            
            var filtered = patients;
            if (keyword && keyword.trim() !== '') {
                var kw = keyword.toLowerCase().trim();
                filtered = patients.filter(function(p) {
                    return p.nama.toLowerCase().includes(kw) || String(p.id_pasien).includes(kw);
                });
            }
            
            if (!filtered || filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:10px;color:var(--text-muted);">Tidak ada pasien ditemukan</td></tr>';
                return;
            }
            
            var selectedId = document.getElementById('field_id_pasien').value;
            var html = '';
            filtered.forEach(function(p, idx) {
                var isSelected = (p.id_pasien == selectedId);
                var statusText = p.msh_dirawat ? 'Dirawat' : 'Pulang';
                var statusColor = p.msh_dirawat ? 'var(--badge-success-bg);color:var(--badge-success-text);' : 'var(--badge-secondary-bg);color:var(--badge-secondary-text);';

                html += `
                    <tr onclick="pilihPasienCheckup('${p.id_pasien}', '${escapeHtml(p.nama)}')" style="cursor:pointer;${isSelected ? 'background:var(--badge-info-bg);' : ''}">
                        <td style="padding:6px 10px;border-bottom:1px solid var(--border-light);"><strong>${idx + 1}</strong></td>
                        <td style="padding:6px 10px;border-bottom:1px solid var(--border-light);">${escapeHtml(p.nama)}</td>
                        <td style="padding:6px 10px;border-bottom:1px solid var(--border-light);">
                            <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:0.65rem;font-weight:600;background:${statusColor}">${statusText}</span>
                        </td>
                        <td style="padding:6px 10px;border-bottom:1px solid var(--border-light);">
                            <button onclick="event.stopPropagation();pilihPasienCheckup('${p.id_pasien}', '${escapeHtml(p.nama)}')" style="background:var(--btn-primary);color:white;border:none;padding:4px 12px;border-radius:12px;cursor:pointer;font-size:0.7rem;">
                                <i class="fas fa-check"></i> Pilih
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
        
        function renderDokterTable(keyword) {
            var tbody = document.getElementById('dokterTableBody');
            if (!tbody) return;
            
            var filtered = doctors;
            if (keyword && keyword.trim() !== '') {
                var kw = keyword.toLowerCase().trim();
                filtered = doctors.filter(function(d) {
                    return d.nama_dokter.toLowerCase().includes(kw) || String(d.id_dokter).includes(kw);
                });
            }
            
            if (!filtered || filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:10px;color:var(--text-muted);">Tidak ada dokter ditemukan</td></tr>';
                return;
            }
            
            var selectedId = document.getElementById('field_id_dokter').value;
            var html = '';
            filtered.forEach(function(d, idx) {
                var isSelected = (d.id_dokter == selectedId);
                html += `
                    <tr onclick="pilihDokterCheckup('${d.id_dokter}', '${escapeHtml(d.nama_dokter)}')" style="cursor:pointer;${isSelected ? 'background:var(--badge-info-bg);' : ''}">
                        <td style="padding:6px 10px;border-bottom:1px solid var(--border-light);"><strong>${idx + 1}</strong></td>
                        <td style="padding:6px 10px;border-bottom:1px solid var(--border-light);">${escapeHtml(d.nama_dokter)}</td>
                        <td style="padding:6px 10px;border-bottom:1px solid var(--border-light);">
                            <button onclick="event.stopPropagation();pilihDokterCheckup('${d.id_dokter}', '${escapeHtml(d.nama_dokter)}')" style="background:var(--btn-primary);color:white;border:none;padding:4px 12px;border-radius:12px;cursor:pointer;font-size:0.7rem;">
                                <i class="fas fa-check"></i> Pilih
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
        
        window.pilihPasienCheckup = function(id, nama) {
            document.getElementById('field_id_pasien').value = id;
            document.getElementById('selectedPasienDisplay').innerHTML = 'ID: ' + id + ' - ' + escapeHtml(nama);
            document.getElementById('selectedPasienDisplay').style.color = 'var(--badge-success-text)';
            
            var rows = document.querySelectorAll('#pasienTableBody tr');
            rows.forEach(function(row) { row.style.background = ''; });
            rows.forEach(function(row) {
                if (row.textContent.includes('ID: ' + id)) {
                    row.style.background = 'var(--badge-info-bg)';
                }
            });
        };
        
        window.pilihDokterCheckup = function(id, nama) {
            document.getElementById('field_id_dokter').value = id;
            document.getElementById('selectedDokterDisplay').innerHTML = 'ID: ' + id + ' - ' + escapeHtml(nama);
            document.getElementById('selectedDokterDisplay').style.color = 'var(--badge-success-text)';
            
            var rows = document.querySelectorAll('#dokterTableBody tr');
            rows.forEach(function(row) { row.style.background = ''; });
            rows.forEach(function(row) {
                if (row.textContent.includes('ID: ' + id)) {
                    row.style.background = 'var(--badge-info-bg)';
                }
            });
        };
        
        document.getElementById('searchPasienBtn').addEventListener('click', function() {
            renderPasienTable(document.getElementById('pasienSearchInput').value);
        });
        document.getElementById('resetPasienBtn').addEventListener('click', function() {
            document.getElementById('pasienSearchInput').value = '';
            renderPasienTable('');
        });
        document.getElementById('pasienSearchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); document.getElementById('searchPasienBtn').click(); }
        });
        
        document.getElementById('searchDokterBtn').addEventListener('click', function() {
            renderDokterTable(document.getElementById('dokterSearchInput').value);
        });
        document.getElementById('resetDokterBtn').addEventListener('click', function() {
            document.getElementById('dokterSearchInput').value = '';
            renderDokterTable('');
        });
        document.getElementById('dokterSearchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); document.getElementById('searchDokterBtn').click(); }
        });
        
        setTimeout(function() {
            renderPasienTable('');
            renderDokterTable('');
            
            var pasienInput = document.getElementById('pasienSearchInput');
            if (pasienInput && selectedPasienName) {
                pasienInput.value = selectedPasienName + ' (ID: ' + checkup.id_pasien + ')';
            }
            
            var dokterInput = document.getElementById('dokterSearchInput');
            if (dokterInput && selectedDokterName) {
                dokterInput.value = selectedDokterName + ' (ID: ' + checkup.id_dokter + ')';
            }
        }, 100);
        
        form.onsubmit = function(e) {
            e.preventDefault();
            
            var idPasien = document.getElementById('field_id_pasien').value;
            var idDokter = document.getElementById('field_id_dokter').value;
            
            if (!idPasien) {
                showToast('Silakan pilih Pasien!', 'error');
                return;
            }
            if (!idDokter) {
                showToast('Silakan pilih Dokter!', 'error');
                return;
            }
            
            var selectedPasien = patients.find(function(p) { return p.id_pasien == idPasien; });
            if (selectedPasien && selectedPasien.msh_dirawat == 1) {
                showToast('Pasien sedang dirawat inap! Pulangkan dulu sebelum checkup.', 'error');
                return;
            }
            
            var formData = {
                id_pasien: idPasien,
                id_dokter: idDokter,
                tanggal: document.getElementById('field_tanggal').value,
                jam: document.getElementById('field_jam').value,
                status: document.getElementById('field_status').value,
                biaya_checkup: parseFloat(document.getElementById('field_biaya_checkup').value) || 0,
                keterangan: document.getElementById('field_keterangan').value
            };
            
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            
            apiService.updateCheckup(id, formData)
                .then(function() {
                    showToast('Checkup berhasil diupdate!', 'success');
                    closeModal();
                    loadJadwalCheckup();
                })
                .catch(function(err) {
                    showToast('Error: ' + err.message, 'error');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
                });
        };
        
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                closeModal();
            }
        };
        
    })
    .catch(function(err) {
        showToast('Error: ' + err.message, 'error');
    });
}

// ==================== EDIT DOKTER ====================

function editDokter(id) {
    apiService.getDokter()
        .then(function(data) {
            var dokter = data.find(function(d) { return d.id_dokter === id; });
            if (!dokter) {
                showToast('Data tidak ditemukan', 'error');
                return;
            }
            
            var fields = [
                { name: 'nama_dokter', label: 'Nama Dokter', type: 'text', required: true },
                { name: 'spesialisasi', label: 'Spesialisasi', type: 'text' },
                { name: 'umur', label: 'Umur', type: 'number', min: 0 },
                { name: 'no_telepon', label: 'No Telepon', type: 'text' },
                { name: 'biaya_honor', label: 'Biaya Honor', type: 'number', min: 0 }
            ];
            
            openModal('Edit Dokter', fields, dokter, function(formData, onSuccess, onError) {
                apiService.updateDokter(id, formData)
                    .then(function() {
                        showToast('Dokter berhasil diupdate!', 'success');
                        loadDokter();
                        onSuccess();
                    })
                    .catch(function(err) {
                        onError(err);
                    });
            });
        })
        .catch(function(err) {
            showToast('Error: ' + err.message, 'error');
        });
}

// ==================== EDIT RUANGAN ====================

function editRuangan(id) {
    console.log('[INFO] editRuangan dipanggil dengan ID:', id);
    
    if (!id) {
        showToast('ID ruangan tidak valid!', 'error');
        return;
    }
    
    Promise.all([
        apiService.getRuanganStatus(),
        apiService.getPasien()
    ])
    .then(function(results) {
        var ruanganList = results[0] || [];
        var patients = results[1] || [];
        
        var ruangan = ruanganList.find(function(r) { return r.id_ruangan === id; });
        if (!ruangan) {
            showToast('Data ruangan tidak ditemukan!', 'error');
            return;
        }
        
        console.log('[DEBUG] Ruangan ditemukan:', ruangan);
        
        var overlay = document.createElement('div');
        overlay.id = 'editModal';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99998;display:flex;justify-content:center;align-items:center;';
        
        var box = document.createElement('div');
        box.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:650px;width:95%;max-height:90vh;overflow-y:auto;';
        
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid var(--btn-primary);padding-bottom:10px;';
        header.innerHTML = '<h2 style="margin:0;color:var(--text-secondary);"><i class="fas fa-edit"></i> Edit Ruangan</h2><span onclick="closeModal()" style="font-size:24px;cursor:pointer;color:var(--text-muted);">&times;</span>';
        box.appendChild(header);
        
        var form = document.createElement('form');
        form.id = 'editRuanganForm';
        form.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px 24px;';
        
        var nameGroup = document.createElement('div');
        nameGroup.style.cssText = 'grid-column:1/2;';
        nameGroup.innerHTML = `
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);">Nama Ruangan *</label>
            <input type="text" id="field_nama_ruangan" value="${escapeHtml(ruangan.nama_ruangan || '')}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;">
        `;
        form.appendChild(nameGroup);
        
        var nomorGroup = document.createElement('div');
        nomorGroup.style.cssText = 'grid-column:2/3;';
        nomorGroup.innerHTML = `
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);">Nomor Ruangan *</label>
            <input type="number" id="field_nomor_ruangan" value="${ruangan.nomor_ruangan || ''}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;">
        `;
        form.appendChild(nomorGroup);
        
        var statusGroup = document.createElement('div');
        statusGroup.style.cssText = 'grid-column:1/2;';
        statusGroup.innerHTML = `
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);">Status</label>
            <select id="field_status" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;background:white;">
                <option value="kosong" ${ruangan.status === 'kosong' ? 'selected' : ''}>Kosong</option>
                <option value="terisi" ${ruangan.status === 'terisi' ? 'selected' : ''}>Terisi</option>
            </select>
        `;
        form.appendChild(statusGroup);
        
        var biayaGroup = document.createElement('div');
        biayaGroup.style.cssText = 'grid-column:2/3;';
        biayaGroup.innerHTML = `
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);">Biaya Per Hari (Rp)</label>
            <input type="number" id="field_biaya_per_hari" value="${ruangan.biaya_per_hari || 0}" step="1000" min="0" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;">
        `;
        form.appendChild(biayaGroup);
        
        var lamaRawatGroup = document.createElement('div');
        lamaRawatGroup.id = 'lamaRawatGroup';
        lamaRawatGroup.style.cssText = 'grid-column:1/-1;display:' + (ruangan.ditempati ? 'block' : 'none') + ';';
        lamaRawatGroup.innerHTML = `
            <div style="background:var(--badge-success-bg);padding:12px 16px;border-radius:8px;border:1px solid var(--badge-success-bg);">
                <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);">
                    <i class="fas fa-clock"></i> Lama Rawat Inap (hari) *
                </label>
                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                    <input type="number" id="field_lama_inap" value="${ruangan.lama_inap || 1}" min="1" max="365" 
                           style="width:120px;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;text-align:center;">
                    <span style="font-size:0.85rem;color:var(--badge-secondary-text);">
                        <i class="fas fa-calculator"></i> Total: <strong id="previewTotalLama">${formatCurrency((ruangan.biaya_per_hari || 0) * (ruangan.lama_inap || 1))}</strong>
                    </span>
                    <span style="font-size:0.75rem;color:var(--text-light);">
                        <i class="fas fa-info-circle"></i> Minimal 1 hari
                    </span>
                </div>
            </div>
        `;
        form.appendChild(lamaRawatGroup);
        
        var pasienGroup = document.createElement('div');
        pasienGroup.style.cssText = 'grid-column:1/-1;margin-top:4px;';
        pasienGroup.innerHTML = `
            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:13px;color:var(--text-secondary);">
                <i class="fas fa-user"></i> Pilih Pasien
            </label>
            <div style="display:flex;gap:8px;margin-bottom:8px;">
                <input type="text" id="patientSearchInput" placeholder="Cari nama atau ID pasien..." style="flex:1;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;">
                <button type="button" id="searchPatientBtn" style="background:var(--btn-primary);color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;">Cari</button>
                <button type="button" id="resetPatientBtn" style="background:var(--bg-secondary);color:var(--text-secondary);border:none;padding:8px 16px;border-radius:8px;cursor:pointer;">Reset</button>
            </div>
            <div id="patientList" style="max-height:150px;overflow-y:auto;border:1px solid var(--border-light);border-radius:8px;margin-bottom:8px;">
                <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                    <thead style="position:sticky;top:0;background:var(--bg-table-header);">
                        <tr>
                            <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border-color);">No</th>
                            <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border-color);">Nama</th>
                            <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border-color);">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="patientTableBody">
                        <tr><td colspan="3" style="text-align:center;padding:10px;color:var(--text-muted);">Memuat data pasien...</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="selectedPatientDisplay" style="padding:8px 12px;background:var(--badge-success-bg);border-radius:8px;border:1px solid var(--badge-success-bg);font-weight:500;color:var(--badge-success-text);">
                ${ruangan.ditempati ? 'ID: ' + ruangan.ditempati + ' - ' + escapeHtml(ruangan.nama_pasien || 'Unknown') : 'Belum ada pasien dipilih'}
            </div>
            <input type="hidden" id="field_ditempati" value="${ruangan.ditempati || ''}">
            <div style="margin-top:6px;font-size:0.75rem;color:var(--text-light);">
                <i class="fas fa-info-circle"></i> Pilih pasien untuk mengisi ruangan, status akan otomatis berubah menjadi "Terisi"
            </div>
        `;
        form.appendChild(pasienGroup);
        
        var btnWrapper = document.createElement('div');
        btnWrapper.style.cssText = 'grid-column:1/-1;display:flex;gap:12px;margin-top:12px;padding-top:16px;border-top:1px solid var(--border-color);';
        
        var saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.style.cssText = 'flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;';
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
        btnWrapper.appendChild(saveBtn);
        
        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.style.cssText = 'padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);font-size:14px;';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Batal';
        cancelBtn.onclick = function() { closeModal(); };
        btnWrapper.appendChild(cancelBtn);
        
        form.appendChild(btnWrapper);
        box.appendChild(form);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        function updateStatusAndLamaRawat(hasPatient) {
            var statusSelect = document.getElementById('field_status');
            var lamaGroup = document.getElementById('lamaRawatGroup');
            
            if (hasPatient) {
                statusSelect.value = 'terisi';
                lamaGroup.style.display = 'block';
                var lamaInput = document.getElementById('field_lama_inap');
                if (!lamaInput.value || lamaInput.value === '0') {
                    lamaInput.value = 1;
                }
                updatePreviewTotal();
            } else {
                statusSelect.value = 'kosong';
                lamaGroup.style.display = 'none';
                document.getElementById('field_ditempati').value = '';
                document.getElementById('selectedPatientDisplay').innerHTML = 'Belum ada pasien dipilih';
            }
        }
        
        function renderPatientList(patients) {
            var tbody = document.getElementById('patientTableBody');
            if (!tbody) return;
            if (!patients || patients.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:10px;color:var(--text-muted);">Tidak ada pasien ditemukan</td></tr>';
                return;
            }
            var selectedId = document.getElementById('field_ditempati').value;
            var html = '';
            patients.forEach(function(p, idx) {
                var isSelected = (p.id_pasien == selectedId);
                html += `
                    <tr onclick="pilihPasienRuangan('${p.id_pasien}', '${escapeHtml(p.nama)}')" style="cursor:pointer;${isSelected ? 'background:var(--badge-info-bg);' : ''}">
                        <td style="padding:6px 10px;border-bottom:1px solid var(--border-light);">${idx + 1}</td>
                        <td style="padding:6px 10px;border-bottom:1px solid var(--border-light);">${escapeHtml(p.nama)}</td>
                        <td style="padding:6px 10px;border-bottom:1px solid var(--border-light);">
                            <button type="button" onclick="event.stopPropagation();pilihPasienRuangan('${p.id_pasien}', '${escapeHtml(p.nama)}')" style="background:var(--btn-primary);color:white;border:none;padding:4px 12px;border-radius:12px;cursor:pointer;font-size:0.7rem;">
                                <i class="fas fa-check"></i> Pilih
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
        
        window.pilihPasienRuangan = function(id, nama) {
            document.getElementById('field_ditempati').value = id;
            document.getElementById('selectedPatientDisplay').innerHTML = 'ID: ' + id + ' - ' + escapeHtml(nama);
            document.getElementById('selectedPatientDisplay').style.color = 'var(--badge-success-text)';
            
            updateStatusAndLamaRawat(true);
            
            var rows = document.querySelectorAll('#patientTableBody tr');
            rows.forEach(function(row) { row.style.background = ''; });
            rows.forEach(function(row) {
                if (row.textContent.includes('ID: ' + id)) {
                    row.style.background = 'var(--badge-info-bg)';
                }
            });
            
            updatePreviewTotal();
            
            console.log('[DEBUG] Pasien dipilih:', id, nama);
        };
        
        function updatePreviewTotal() {
            var days = parseInt(document.getElementById('field_lama_inap').value) || 0;
            var biayaPerHari = parseFloat(document.getElementById('field_biaya_per_hari').value) || 0;
            var total = days * biayaPerHari;
            var previewEl = document.getElementById('previewTotalLama');
            if (previewEl) {
                previewEl.innerText = formatCurrency(total);
            }
        }
        
        document.getElementById('searchPatientBtn').addEventListener('click', function() {
            var keyword = document.getElementById('patientSearchInput').value.trim().toLowerCase();
            if (!keyword) {
                renderPatientList(patients);
                return;
            }
            var filtered = patients.filter(function(p) {
                return p.nama.toLowerCase().includes(keyword) || String(p.id_pasien).includes(keyword);
            });
            renderPatientList(filtered);
        });
        
        document.getElementById('resetPatientBtn').addEventListener('click', function() {
            document.getElementById('patientSearchInput').value = '';
            renderPatientList(patients);
        });
        
        document.getElementById('patientSearchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('searchPatientBtn').click();
            }
        });
        
        document.getElementById('field_lama_inap').addEventListener('input', updatePreviewTotal);
        document.getElementById('field_biaya_per_hari').addEventListener('input', updatePreviewTotal);
        
        document.getElementById('field_status').addEventListener('change', function() {
            var lamaGroup = document.getElementById('lamaRawatGroup');
            if (this.value === 'terisi') {
                lamaGroup.style.display = 'block';
                var selectedId = document.getElementById('field_ditempati').value;
                if (!selectedId) {
                    showToast('Silakan pilih pasien terlebih dahulu!', 'info');
                }
            } else {
                lamaGroup.style.display = 'none';
                document.getElementById('field_ditempati').value = '';
                document.getElementById('selectedPatientDisplay').innerHTML = 'Belum ada pasien dipilih';
            }
        });
        
        renderPatientList(patients);
        updatePreviewTotal();
        
        form.onsubmit = function(e) {
            e.preventDefault();
            
            var nama_ruangan = document.getElementById('field_nama_ruangan').value.trim();
            var nomor_ruangan = parseInt(document.getElementById('field_nomor_ruangan').value);
            var status = document.getElementById('field_status').value;
            var ditempati = parseInt(document.getElementById('field_ditempati').value) || null;
            var biaya_per_hari = parseFloat(document.getElementById('field_biaya_per_hari').value) || 0;
            var lama_inap = parseInt(document.getElementById('field_lama_inap').value) || 1;
            
            console.log('[DEBUG] Data yang akan dikirim:', {
                nama_ruangan, nomor_ruangan, status, ditempati, biaya_per_hari, lama_inap
            });
            
            if (!nama_ruangan) {
                showToast('Nama ruangan wajib diisi!', 'error');
                return;
            }
            if (isNaN(nomor_ruangan) || nomor_ruangan <= 0) {
                showToast('Nomor ruangan wajib diisi!', 'error');
                return;
            }
            
            if (status === 'terisi' && !ditempati) {
                showToast('Silakan pilih pasien untuk ruangan yang terisi!', 'error');
                return;
            }
            
            if (status === 'terisi' && (isNaN(lama_inap) || lama_inap < 1)) {
                showToast('Lama rawat inap minimal 1 hari!', 'error');
                return;
            }
            
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            
            if (status === 'terisi' && ditempati) {
                apiService.request('/admin/ruangan/' + id + '/status', {
                    method: 'PUT',
                    body: { 
                        status: status, 
                        id_pasien: ditempati,
                        lama_inap: lama_inap,
                        biaya_per_hari: biaya_per_hari
                    }
                })
                .then(function() {
                    showToast('Ruangan dan tagihan rawat inap berhasil diupdate!', 'success');
                    closeModal();
                    loadRuangan();
                })
                .catch(function(err) {
                    console.error('[ERROR] Update ruangan status:', err);
                    showToast('Error: ' + err.message, 'error');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
                });
                return;
            }
            
            var data = {
                nama_ruangan: nama_ruangan,
                nomor_ruangan: nomor_ruangan,
                status: status,
                ditempati: null,
                biaya_per_hari: biaya_per_hari
            };
            
            apiService.updateRuangan(id, data)
                .then(function() {
                    showToast('Ruangan berhasil diupdate!', 'success');
                    closeModal();
                    loadRuangan();
                })
                .catch(function(err) {
                    console.error('[ERROR] Update ruangan:', err);
                    showToast('Error: ' + err.message, 'error');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
                });
        };
        
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                closeModal();
            }
        };
        
    })
    .catch(function(err) {
        console.error('[ERROR] editRuangan:', err);
        showToast('Error: ' + err.message, 'error');
    });
}

// ==================== EDIT STAFF ====================

function editStaff(id) {
    apiService.getStaff()
        .then(function(data) {
            var staff = data.find(function(s) { return s.id_staff === id; });
            if (!staff) {
                showToast('Data tidak ditemukan', 'error');
                return;
            }
            
            var fields = [
                { name: 'nama_staff', label: 'Nama Staff', type: 'text', required: true },
                { name: 'jabatan', label: 'Jabatan', type: 'text' },
                { name: 'no_telepon', label: 'No Telepon', type: 'text' },
                { name: 'gaji', label: 'Gaji', type: 'number', required: true, min: 0 }
            ];
            
            openModal('Edit Staff', fields, staff, function(formData, onSuccess, onError) {
                apiService.updateStaff(id, formData)
                    .then(function() {
                        showToast('Staff berhasil diupdate!', 'success');
                        loadStaff();
                        onSuccess();
                    })
                    .catch(function(err) {
                        onError(err);
                    });
            });
        })
        .catch(function(err) {
            showToast('Error: ' + err.message, 'error');
        });
}

// ==================== MODAL LAMA RAWAT ====================

function showLamaRawatModal(ruanganId, idPasien, namaPasien, biayaPerHari, onSuccess) {
    var existing = document.getElementById('lamaRawatModal');
    if (existing) existing.remove();
    
    var overlay = document.createElement('div');
    overlay.id = 'lamaRawatModal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;justify-content:center;align-items:center;';
    
    var box = document.createElement('div');
    box.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:450px;width:95%;';
    
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:2px solid var(--btn-primary);padding-bottom:10px;';
    header.innerHTML = `
        <h2 style="margin:0;color:var(--text-secondary);font-size:1.2rem;">
            <i class="fas fa-clock" style="color:var(--btn-primary);"></i> Lama Rawat Inap
        </h2>
        <span onclick="document.getElementById('lamaRawatModal').remove()" style="font-size:24px;cursor:pointer;color:var(--text-muted);">&times;</span>
    `;
    box.appendChild(header);
    
    var info = document.createElement('div');
    info.style.cssText = 'background:var(--bg-table-header);padding:12px 16px;border-radius:8px;margin-bottom:16px;';
    info.innerHTML = `
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span><strong>Pasien:</strong> ${escapeHtml(namaPasien)}</span>
            <span><strong>Biaya/Hari:</strong> ${formatCurrency(biayaPerHari)}</span>
        </div>
    `;
    box.appendChild(info);
    
    var form = document.createElement('form');
    form.id = 'lamaRawatForm';
    
    var group = document.createElement('div');
    group.style.cssText = 'margin-bottom:16px;';
    group.innerHTML = `
        <label style="display:block;font-weight:600;margin-bottom:6px;font-size:14px;color:var(--text-secondary);">
            <i class="fas fa-calendar-day"></i> Lama Rawat Inap (hari) *
        </label>
        <input type="number" id="inputLamaRawat" value="1" min="1" max="365" 
               style="width:100%;padding:10px 14px;border:1px solid var(--border-color);border-radius:8px;font-size:16px;text-align:center;">
        <div style="display:flex;gap:12px;margin-top:8px;font-size:0.8rem;color:var(--text-light);">
            <span><i class="fas fa-info-circle"></i> Minimal 1 hari</span>
            <span><i class="fas fa-calculator"></i> Total: <strong id="previewTotal">Rp100.000</strong></span>
        </div>
    `;
    form.appendChild(group);
    
    var previewTotal = document.getElementById('previewTotal');
    var inputLamaRawat = document.getElementById('inputLamaRawat');
    
    inputLamaRawat.addEventListener('input', function() {
        var days = parseInt(this.value) || 0;
        var total = days * biayaPerHari;
        document.getElementById('previewTotal').innerText = formatCurrency(total);
    });
    
    var btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display:flex;gap:12px;margin-top:8px;';
    
    var simpanBtn = document.createElement('button');
    simpanBtn.type = 'submit';
    simpanBtn.style.cssText = 'flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;';
    simpanBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Rawat Inap';
    btnGroup.appendChild(simpanBtn);
    
    var batalBtn = document.createElement('button');
    batalBtn.type = 'button';
    batalBtn.style.cssText = 'padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);font-size:14px;';
    batalBtn.innerHTML = '<i class="fas fa-times"></i> Batal';
    batalBtn.onclick = function() { document.getElementById('lamaRawatModal').remove(); };
    btnGroup.appendChild(batalBtn);
    
    form.appendChild(btnGroup);
    box.appendChild(form);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    form.onsubmit = function(e) {
        e.preventDefault();
        var days = parseInt(document.getElementById('inputLamaRawat').value);
        if (!days || days < 1) {
            showToast('Masukkan lama rawat inap minimal 1 hari!', 'error');
            return;
        }
        document.getElementById('lamaRawatModal').remove();
        onSuccess(days);
    };
    
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    };
    
    setTimeout(function() {
        document.getElementById('inputLamaRawat').focus();
        document.getElementById('inputLamaRawat').select();
    }, 100);
}

// ==================== HAPUS PASIEN ====================
async function hapusPasien(id, nama) {
    if (!confirm('Yakin ingin menghapus pasien "' + nama + '"?')) return;
    if (!confirm('Data checkup, tagihan, dan ruangan yang terkait juga akan dihapus! Lanjutkan?')) return;
    
    try {
        await apiService.request('/admin/pasien/' + id, { method: 'DELETE' });
        showToast('Pasien berhasil dihapus!', 'success');
        loadPasien();
        updateSummaryCards();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ==================== HAPUS BAYI ====================
async function hapusBayi(id, nama) {
    if (!confirm('Yakin ingin menghapus bayi "' + nama + '"?')) return;
    
    try {
        await apiService.request('/admin/bayi/' + id, { method: 'DELETE' });
        showToast('Bayi berhasil dihapus!', 'success');
        loadBayi();
        updateSummaryCards();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ==================== HAPUS DOKTER ====================
async function hapusDokter(id, nama) {
    if (!confirm('Yakin ingin menghapus dokter "' + nama + '"?')) return;
    
    try {
        await apiService.request('/admin/dokter/' + id, { method: 'DELETE' });
        showToast('Dokter berhasil dihapus!', 'success');
        loadDokter();
        updateSummaryCards();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ==================== HAPUS RUANGAN ====================
async function hapusRuangan(id, nama) {
    if (!confirm('Yakin ingin menghapus ruangan "' + nama + '"?')) return;
    
    try {
        await apiService.request('/admin/ruangan/' + id, { method: 'DELETE' });
        showToast('Ruangan berhasil dihapus!', 'success');
        loadRuangan();
        updateSummaryCards();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ==================== HAPUS STAFF ====================
async function hapusStaff(id, nama) {
    if (!confirm('Yakin ingin menghapus staff "' + nama + '"?')) return;
    
    try {
        await apiService.request('/admin/staff/' + id, { method: 'DELETE' });
        showToast('Staff berhasil dihapus!', 'success');
        loadStaff();
        updateSummaryCards();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ==================== EXPOSE KE GLOBAL ====================

window.loadDokter = loadDokter;
window.editDokter = editDokter;
window.editPasien = editPasien;
window.editBayi = editBayi;
window.editCheckup = editCheckup;
window.batalCheckup = batalCheckup;
window.editRuangan = editRuangan;
window.editStaff = editStaff;
window.editShiftStaff = editShiftStaff;
window.editShiftUser = editShiftUser;
window.markNotifikasiRead = markNotifikasiRead;
window.closeModal = closeModal;
window.hapusPasien = hapusPasien;
window.hapusBayi = hapusBayi;
window.hapusDokter = hapusDokter;
window.hapusRuangan = hapusRuangan;
window.hapusStaff = hapusStaff;
window.loadJadwalCheckup = loadJadwalCheckup;
window.loadSudahCheckout = loadSudahCheckout;

console.log('dashboardAdminController (modal form + Font Awesome) loaded');
console.log('EditPasien tersedia:', typeof editPasien);