/**
 * Dokter Dashboard Controller
 * Version: 2.9 - FIXED Modal Selesaikan Checkup
 */

console.log('[DOKTER] Loading dashboard...');

// ==================== NOTIFIKASI ====================
function showNotifikasiPasien(message, type) {
    var container = document.getElementById('notificationPasien');
    if (!container) return;
    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    var classes = { success: 'notification-success', error: 'notification-error', info: 'notification-info' };
    var notif = document.createElement('div');
    notif.className = 'notification ' + (classes[type] || classes.info);
    var progress = document.createElement('div');
    progress.className = 'notification-progress';
    notif.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span style="flex:1;">' + message + '</span>' +
        '<button class="close-btn" onclick="this.closest(\'.notification\').classList.add(\'hiding\'); setTimeout(function(){ if(this.parentElement) this.parentElement.remove(); }, 400);">&times;</button>';
    notif.appendChild(progress);
    container.appendChild(notif);
    var hideTimeout = setTimeout(function() {
        if (notif.parentNode) { notif.classList.add('hiding'); setTimeout(function() { if (notif.parentNode) notif.remove(); }, 400); }
    }, 4500);
    var closeBtn = notif.querySelector('.close-btn');
    if (closeBtn) closeBtn.addEventListener('click', function() { clearTimeout(hideTimeout); });
}

function showNotifikasiCheckup(message, type) {
    var container = document.getElementById('notificationCheckup');
    if (!container) return;
    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    var classes = { success: 'notification-success', error: 'notification-error', info: 'notification-info' };
    var notif = document.createElement('div');
    notif.className = 'notification ' + (classes[type] || classes.info);
    var progress = document.createElement('div');
    progress.className = 'notification-progress';
    notif.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span style="flex:1;">' + message + '</span>' +
        '<button class="close-btn" onclick="this.closest(\'.notification\').classList.add(\'hiding\'); setTimeout(function(){ if(this.parentElement) this.parentElement.remove(); }, 400);">&times;</button>';
    notif.appendChild(progress);
    container.appendChild(notif);
    var hideTimeout = setTimeout(function() {
        if (notif.parentNode) { notif.classList.add('hiding'); setTimeout(function() { if (notif.parentNode) notif.remove(); }, 400); }
    }, 4500);
    var closeBtn = notif.querySelector('.close-btn');
    if (closeBtn) closeBtn.addEventListener('click', function() { clearTimeout(hideTimeout); });
}

// Override
var originalShowSuccess = window.showSuccess;
var originalShowError = window.showError;
var originalShowToast = window.showToast;
window.showSuccess = function(message) { showNotifikasiPasien(message, 'success'); if (originalShowSuccess) originalShowSuccess(message); };
window.showError = function(message) { showNotifikasiPasien(message, 'error'); if (originalShowError) originalShowError(message); };
window.showToast = function(message, type) { showNotifikasiPasien(message, type); if (originalShowToast) originalShowToast(message, type); };
window.showInfo = function(message) { showNotifikasiPasien(message, 'info'); };

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[DOKTER] DOM ready');
    var username = localStorage.getItem('username') || 'Dokter';
    var namaUserSpan = document.getElementById('namaUser');
    if (namaUserSpan) namaUserSpan.innerText = username || 'Dokter';

    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            utils.logout();
        };
    }

    try {
        await loadDashboardStats();
        await loadDaftarPasien();
        await loadJadwal();
    } catch (err) {
        console.error('[DOKTER] Error:', err);
        showNotifikasiPasien('Gagal memuat data: ' + err.message, 'error');
    }

    var searchInput = document.getElementById('searchPasien');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async function(e) {
            await loadDaftarPasien(e.target.value.trim());
        }, 400));
    }
});

// ==================== DASHBOARD STATS ====================
async function loadDashboardStats() {
    try {
        var stats = await apiService.getDashboardDokter();
        var totalPasienEl = document.getElementById('totalPasien');
        var pasienHariIniEl = document.getElementById('pasienHariIni');
        if (totalPasienEl) { totalPasienEl.innerText = stats.totalPasien || 0; animateNumber(totalPasienEl); }
        if (pasienHariIniEl) { pasienHariIniEl.innerText = stats.pasienHariIni || 0; animateNumber(pasienHariIniEl); }
    } catch (err) {
        console.error('[DOKTER] Stats error:', err);
    }
}

function animateNumber(element) {
    var target = parseInt(element.innerText);
    if (target === 0 || isNaN(target)) return;
    var current = 0, increment = Math.ceil(target / 20), stepTime = 500 / 20;
    var interval = setInterval(function() {
        current += increment;
        if (current >= target) { current = target; clearInterval(interval); }
        element.innerText = current;
    }, stepTime);
}

// ==================== DAFTAR PASIEN ====================
async function loadDaftarPasien(keyword) {
    keyword = keyword || '';
    var tbodyDirawat = document.getElementById('tbodyPasienDirawat');
    var tbodyPulang = document.getElementById('tbodyPasienPulang');
    if (!tbodyDirawat || !tbodyPulang) return;
    try {
        tbodyDirawat.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i> Memuat...</td></tr>';
        tbodyPulang.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i> Memuat...</td></tr>';
        var pasienList = await apiService.getPasienSaya(keyword);
        if (!pasienList || pasienList.length === 0) {
            tbodyDirawat.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);"><i class="fas fa-user-injured"></i> Tidak ada pasien sedang dirawat</td></tr>';
            tbodyPulang.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);"><i class="fas fa-check-circle"></i> Belum ada pasien yang pulang</td></tr>';
            return;
        }
        var pasienDirawat = pasienList.filter(p => p.msh_dirawat === 'dirawat');
        var pasienPulang = pasienList.filter(p => p.msh_dirawat === 'pulang');
        // render dirawat
        if (pasienDirawat.length === 0) {
            tbodyDirawat.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);"><i class="fas fa-user-injured"></i> Tidak ada pasien sedang dirawat</td></tr>';
        } else {
            var htmlDirawat = '';
            pasienDirawat.forEach(function(p) {
                var jk = p.jenis_kelamin === 'L' ? 'Laki-laki' : p.jenis_kelamin === 'P' ? 'Perempuan' : '-';
                htmlDirawat += `<tr data-id="${p.id_pasien}">
                    <td><strong>${escapeHtml(p.nama)}</strong></td>
                    <td>${p.umur || '-'}</td>
                    <td>${jk}</td>
                    <td>${escapeHtml(p.nama_penyakit || '-')}</td>
                    <td><textarea class="desc-textarea" data-id="${p.id_pasien}" rows="2" style="width:100%;min-width:120px;padding:6px 10px;border:1px solid var(--border-light);border-radius:8px;font-size:0.8rem;">${escapeHtml(p.deskripsi_dokter || '')}</textarea></td>
                    <td style="white-space:nowrap;">
                        <button class="btn-save" data-id="${p.id_pasien}" style="background:var(--btn-primary);color:white;border:none;padding:4px 14px;border-radius:20px;font-size:0.75rem;cursor:pointer;"><i class="fas fa-save"></i> Simpan</button>
                        <button class="btn-discharge" data-id="${p.id_pasien}" data-nama="${escapeHtml(p.nama)}" style="background:var(--btn-danger);color:white;border:none;padding:4px 14px;border-radius:20px;font-size:0.75rem;cursor:pointer;margin-top:4px;"><i class="fas fa-door-open"></i> Pulangkan</button>
                        <button class="btn-pulangkan-ruangan" data-id="${p.id_pasien}" data-nama="${escapeHtml(p.nama)}" style="background:var(--btn-warning);color:white;border:none;padding:4px 14px;border-radius:20px;font-size:0.75rem;cursor:pointer;margin-top:4px;"><i class="fas fa-bed"></i> Pulangkan dari Ruangan</button>
                    </td>
                </tr>`;
            });
            tbodyDirawat.innerHTML = htmlDirawat;
        }
        // render pulang
        if (pasienPulang.length === 0) {
            tbodyPulang.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);"><i class="fas fa-check-circle"></i> Belum ada pasien yang pulang</td></tr>';
        } else {
            var htmlPulang = '';
            pasienPulang.forEach(function(p) {
                var jk = p.jenis_kelamin === 'L' ? 'Laki-laki' : p.jenis_kelamin === 'P' ? 'Perempuan' : '-';
                htmlPulang += `<tr data-id="${p.id_pasien}">
                    <td><strong>${escapeHtml(p.nama)}</strong></td>
                    <td>${p.umur || '-'}</td>
                    <td>${jk}</td>
                    <td>${escapeHtml(p.nama_penyakit || '-')}</td>
                    <td>${escapeHtml(p.deskripsi_dokter || '-')}</td>
                    <td><span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:0.7rem;font-weight:600;background:var(--badge-success-bg);color:var(--badge-success-text);margin-right:8px;"><i class="fas fa-check-circle"></i> Sudah Pulang</span>
                        <button class="btn-batalkan-pulang" data-id="${p.id_pasien}" data-nama="${escapeHtml(p.nama)}" style="background:var(--btn-warning);color:white;border:none;padding:4px 14px;border-radius:20px;font-size:0.75rem;cursor:pointer;margin-top:4px;"><i class="fas fa-undo"></i> Batalkan Pulang</button>
                    </td>
                </tr>`;
            });
            tbodyPulang.innerHTML = htmlPulang;
        }
        setupTableEvents();
    } catch (err) {
        console.error('[DOKTER] Error loading patients:', err);
        tbodyDirawat.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + escapeHtml(err.message) + '</td></tr>';
        tbodyPulang.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + escapeHtml(err.message) + '</td></tr>';
    }
}

// ==================== TABLE EVENTS ====================
function setupTableEvents() {
    document.removeEventListener('click', handleTableClick);
    document.addEventListener('click', handleTableClick);
}

function handleTableClick(e) {
    var btn = e.target.closest('.btn-selesai, .btn-save, .btn-discharge, .btn-batalkan-pulang, .btn-pulangkan-ruangan');
    if (!btn) return;
    var id = btn.dataset.id;
    console.log('[DOKTER] Button clicked:', btn.className, 'ID:', id);
    if (btn.classList.contains('btn-selesai')) {
        // Pastikan ini dipanggil dengan benar
        if (id) selesaikanCheckup(parseInt(id));
    } else if (btn.classList.contains('btn-save')) {
        var textarea = document.querySelector('.desc-textarea[data-id="' + id + '"]');
        if (textarea) updateDeskripsiPasien(id, textarea.value);
    } else if (btn.classList.contains('btn-discharge')) {
        if (confirm('Apakah Anda yakin ingin memulangkan pasien ' + btn.dataset.nama + '?')) dischargePasien(id);
    } else if (btn.classList.contains('btn-batalkan-pulang')) {
        if (confirm('Batalkan pemulangan pasien ' + btn.dataset.nama + '?')) batalkanPulang(id);
    } else if (btn.classList.contains('btn-pulangkan-ruangan')) {
        pulangkanDariRuangan(id, btn.dataset.nama);
    }
}

// ==================== PULANGKAN DARI RUANGAN ====================
async function pulangkanDariRuangan(idPasien, nama) {
    var lama = prompt('Masukkan lama rawat inap (hari):', '1');
    if (lama === null) return;
    var lamaInt = parseInt(lama);
    if (isNaN(lamaInt) || lamaInt < 1) {
        showNotifikasiPasien('Lama rawat inap harus angka positif!', 'error');
        return;
    }
    try {
        var ruangan = await apiService.getRuanganStatus();
        var ruanganPasien = ruangan.find(r => r.ditempati == idPasien && r.status === 'terisi');
        if (!ruanganPasien) {
            showNotifikasiPasien('Pasien tidak ditemukan di ruangan manapun!', 'error');
            return;
        }
        if (confirm('Pulangkan ' + nama + ' dari ruangan ' + ruanganPasien.nama_ruangan + '?')) {
            await apiService.request('/dokter/ruangan/' + ruanganPasien.id_ruangan + '/pulangkan', {
                method: 'PUT',
                body: { id_pasien: idPasien, lama_inap: lamaInt }
            });
            showNotifikasiPasien('Pasien ' + nama + ' berhasil dipulangkan dari ruangan!', 'success');
            var keyword = document.getElementById('searchPasien')?.value || '';
            await loadDaftarPasien(keyword);
            await loadDashboardStats();
        }
    } catch (err) {
        console.error('[DOKTER] Error pulangkan:', err);
        showNotifikasiPasien('Gagal: ' + err.message, 'error');
    }
}

// ==================== UPDATE DESKRIPSI ====================
async function updateDeskripsiPasien(idPasien, deskripsi) {
    try {
        var btn = document.querySelector('.btn-save[data-id="' + idPasien + '"]');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }
        await apiService.updateDeskripsiPasien(idPasien, deskripsi);
        var row = document.querySelector('tr[data-id="' + idPasien + '"]');
        var nama = row ? row.querySelector('td:first-child strong')?.innerText || 'Pasien' : 'Pasien';
        showNotifikasiPasien('Deskripsi pasien ' + nama + ' berhasil disimpan!', 'success');
        var textarea = document.querySelector('.desc-textarea[data-id="' + idPasien + '"]');
        if (textarea) { textarea.style.borderColor = 'var(--btn-success)'; setTimeout(() => textarea.style.borderColor = 'var(--border-light)', 2000); }
    } catch (err) {
        console.error('[DOKTER] Error update deskripsi:', err);
        showNotifikasiPasien('Gagal menyimpan deskripsi: ' + err.message, 'error');
    } finally {
        var btn = document.querySelector('.btn-save[data-id="' + idPasien + '"]');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan'; }
    }
}

// ==================== DISCHARGE PASIEN ====================
async function dischargePasien(idPasien) {
    try {
        var btn = document.querySelector('.btn-discharge[data-id="' + idPasien + '"]');
        var nama = btn ? btn.dataset.nama : 'Pasien';
        await apiService.dischargePasien(idPasien);
        showNotifikasiPasien('Pasien ' + nama + ' berhasil dipulangkan!', 'success');
        var keyword = document.getElementById('searchPasien')?.value || '';
        await loadDaftarPasien(keyword);
        await loadDashboardStats();
    } catch (err) {
        showNotifikasiPasien('Gagal memulangkan pasien: ' + err.message, 'error');
    }
}

// ==================== BATALKAN PULANG ====================
async function batalkanPulang(idPasien) {
    try {
        var btn = document.querySelector('.btn-batalkan-pulang[data-id="' + idPasien + '"]');
        var nama = btn ? btn.dataset.nama : 'Pasien';
        await apiService.batalkanPulangPasien(idPasien);
        showNotifikasiPasien('Pasien ' + nama + ' kembali dirawat!', 'success');
        var keyword = document.getElementById('searchPasien')?.value || '';
        await loadDaftarPasien(keyword);
        await loadDashboardStats();
    } catch (err) {
        showNotifikasiPasien('Gagal membatalkan pulang: ' + err.message, 'error');
    }
}

// ==================== SELESAIKAN CHECKUP ====================
async function selesaikanCheckup(idCheckup) {
    console.log('[DOKTER] selesaikanCheckup dipanggil, ID:', idCheckup);
    if (!idCheckup || isNaN(idCheckup)) {
        showNotifikasiCheckup('ID checkup tidak valid!', 'error');
        return;
    }
    idCheckup = parseInt(idCheckup);
    showSelesaikanCheckupModal(idCheckup);
}

// ==================== MODAL SELESAIKAN CHECKUP (REVISI FINAL) ====================
function showSelesaikanCheckupModal(idCheckup) {
    // Hapus modal lama jika ada
    const existing = document.getElementById('selesaikanModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'selesaikanModal';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';

    const box = document.createElement('div');
    box.className = 'modal-box';
    box.innerHTML = `
        <h2><i class="fas fa-check-circle"></i> Selesaikan Checkup</h2>

        <div class="form-group">
            <label>Diagnosis Penyakit <span class="required">*</span></label>
            <textarea id="diagnosisPenyakit" rows="3" placeholder="Tulis diagnosis penyakit pasien..."></textarea>
        </div>

        <div class="form-group">
            <label>Rekomendasi Obat (opsional)</label>
            <textarea id="rekomendasiObat" rows="2" placeholder="Contoh: Paracetamol 500mg 3x1..."></textarea>
        </div>

        <div class="form-group">
            <label>Status Pasien Setelah Checkup <span class="required">*</span></label>
            <div class="status-buttons">
                <button type="button" id="pilihPulang" class="status-btn pulang"><i class="fas fa-home"></i> Pulang</button>
                <button type="button" id="pilihRawatInap" class="status-btn rawat-inap"><i class="fas fa-bed"></i> Rawat Inap</button>
            </div>
            <div id="statusTerpilih" class="status-selected">
                <i class="fas fa-info-circle"></i>
                <span id="statusTerpilihText">-</span>
            </div>
        </div>

        <div id="ruanganContainer" class="ruangan-container" style="display:none;">
            <div class="ruangan-header">
                <span><i class="fas fa-building"></i> Pilih Ruangan</span>
            </div>
            <div class="ruangan-table-wrap">
                <table class="ruangan-table">
                    <thead><tr><th>Nama Ruangan</th><th>Aksi</th></tr></thead>
                    <tbody id="ruanganTableBody">
                        <tr><td colspan="2">Memuat...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="lama-rawat">
                <label><i class="fas fa-clock"></i> Lama Rawat</label>
                <input type="number" id="lamaRawatInap" value="1" min="1">
                <span>Total: <strong id="previewTotalBiaya">Rp0</strong></span>
            </div>
        </div>

        <div class="modal-buttons">
            <button id="btnSelesaikanConfirm" class="btn-selesaikan"><i class="fas fa-check"></i> Selesaikan Checkup</button>
            <button id="btnBatalModal" class="btn-batal-modal"><i class="fas fa-times"></i> Batal</button>
        </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // State internal modal
    let selectedStatus = null;
    let selectedRuanganId = null;

    // Update total biaya
    function updateTotalBiaya() {
        const lama = parseInt(document.getElementById('lamaRawatInap').value) || 1;
        let harga = 0;
        const activeBtn = document.querySelector('.btn-pilih-ruangan.active');
        if (activeBtn) harga = parseFloat(activeBtn.dataset.harga) || 0;
        document.getElementById('previewTotalBiaya').textContent = formatCurrency(harga * lama);
    }

    // Load ruangan kosong
    async function loadRuanganKosong() {
        try {
            const ruangan = await apiService.getRuanganStatus();
            const kosong = ruangan.filter(r => r.status === 'kosong');
            const tbody = document.getElementById('ruanganTableBody');
            if (kosong.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2">Tidak ada ruangan kosong</td></tr>';
                document.getElementById('pilihPulang').click(); // Otomatis pilih pulang
                return;
            }
            tbody.innerHTML = kosong.map(r => `
                <tr>
                    <td>${escapeHtml(r.nama_ruangan)} (No. ${r.nomor_ruangan})<br><small>${formatCurrency(r.biaya_per_hari)}/hari</small></td>
                    <td><button class="btn-pilih-ruangan" data-id="${r.id_ruangan}" data-harga="${r.biaya_per_hari}">Pilih</button></td>
                </tr>
            `).join('');

            // Event pilih ruangan
            tbody.querySelectorAll('.btn-pilih-ruangan').forEach(btn => {
                btn.addEventListener('click', function() {
                    tbody.querySelectorAll('.btn-pilih-ruangan').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    selectedRuanganId = parseInt(this.dataset.id);
                    updateTotalBiaya();
                });
            });
        } catch (err) {
            document.getElementById('ruanganTableBody').innerHTML = '<tr><td colspan="2">Gagal memuat ruangan</td></tr>';
        }
    }

    // Panggil load ruangan
    loadRuanganKosong();

    // Tombol status
    document.getElementById('pilihPulang').addEventListener('click', function() {
        selectedStatus = 'pulang';
        document.getElementById('ruanganContainer').style.display = 'none';
        document.getElementById('statusTerpilihText').textContent = 'Pasien akan dipulangkan';
        this.classList.add('active');
        document.getElementById('pilihRawatInap').classList.remove('active');
    });

    document.getElementById('pilihRawatInap').addEventListener('click', function() {
        selectedStatus = 'rawat_inap';
        document.getElementById('ruanganContainer').style.display = 'block';
        document.getElementById('statusTerpilihText').textContent = 'Pasien akan dirawat inap';
        this.classList.add('active');
        document.getElementById('pilihPulang').classList.remove('active');
        updateTotalBiaya();
    });

    // Lama rawat
    document.getElementById('lamaRawatInap').addEventListener('input', updateTotalBiaya);

    // Batal
    document.getElementById('btnBatalModal').addEventListener('click', () => overlay.remove());

    // Selesaikan
    document.getElementById('btnSelesaikanConfirm').addEventListener('click', async function() {
        const diagnosis = document.getElementById('diagnosisPenyakit').value.trim();
        const rekomendasiObat = document.getElementById('rekomendasiObat').value.trim();
        if (!diagnosis) { showNotifikasiCheckup('Diagnosis wajib diisi!', 'error'); return; }
        if (!selectedStatus) { showNotifikasiCheckup('Pilih status pasien!', 'error'); return; }
        if (selectedStatus === 'rawat_inap' && !selectedRuanganId) {
            showNotifikasiCheckup('Pilih ruangan terlebih dahulu!', 'error');
            return;
        }
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        try {
            const jadwal = await apiService.getJadwalSaya();
            const checkup = jadwal.find(c => c.id_checkup == idCheckup);
            if (!checkup) throw new Error('Checkup tidak ditemukan');
            const idPasien = checkup.id_pasien;

            await apiService.updateCheckupStatus(idCheckup, diagnosis, rekomendasiObat);

            if (selectedStatus === 'pulang') {
                await apiService.dischargePasien(idPasien);
                showNotifikasiCheckup('Checkup selesai! Pasien dipulangkan.', 'success');
            } else {
                const lama = parseInt(document.getElementById('lamaRawatInap').value) || 1;
                await apiService.updateRuanganStatus(selectedRuanganId, {
                    status: 'terisi',
                    id_pasien: idPasien,
                    lama_inap: lama
                });
                showNotifikasiCheckup('Checkup selesai! Pasien dirawat inap.', 'success');
            }
            overlay.remove();
            await loadJadwal();
            await loadDashboardStats();
            await loadDaftarPasien();
        } catch (err) {
            console.error('[DOKTER] Error:', err);
            showNotifikasiCheckup('Gagal: ' + err.message, 'error');
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-check"></i> Selesaikan Checkup';
        }
    });
}

// ==================== JADWAL ====================
let jadwalState = { data: [], page: 1, limit: 5, total: 0, totalPages: 0 };

async function loadJadwal() {
    var tbody = document.getElementById('jadwalBody');
    if (!tbody) return;
    try {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i> Memuat jadwal...</td></tr>';
        var jadwal = await apiService.getJadwalSaya();
        if (!jadwal || jadwal.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);"><i class="fas fa-calendar-times" style="font-size:2rem;display:block;margin-bottom:12px;color:var(--text-light);"></i> Belum ada jadwal checkup</td></tr>';
            updateJadwalPaginationInfo(0);
            return;
        }
        jadwalState.data = jadwal;
        jadwalState.total = jadwal.length;
        jadwalState.totalPages = Math.ceil(jadwalState.total / jadwalState.limit);
        renderJadwalPage();
        updateJadwalPaginationInfo(jadwalState.total);
    } catch (err) {
        console.error('[DOKTER] Error load jadwal:', err);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + escapeHtml(err.message) + '</td></tr>';
    }
}

function renderJadwalPage() {
    var tbody = document.getElementById('jadwalBody');
    if (!tbody) return;
    var start = (jadwalState.page - 1) * jadwalState.limit;
    var end = Math.min(start + jadwalState.limit, jadwalState.total);
    var pageData = jadwalState.data.slice(start, end);
    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);"><i class="fas fa-calendar-times"></i> Tidak ada jadwal</td></tr>';
        return;
    }
    var html = '';
    pageData.forEach(function(j, idx) {
        var checkin = '-', checkout = '-';
        if (j.tanggal && j.jam) {
            var dateStr = (typeof j.tanggal === 'string' && j.tanggal.includes('T')) ? j.tanggal.split('T')[0] : j.tanggal;
            var dateObj = new Date(dateStr + ' ' + j.jam);
            if (!isNaN(dateObj.getTime())) {
                checkin = dateObj.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            } else {
                checkin = dateStr + ' ' + j.jam;
            }
        }
        if (j.checkout) {
            var checkoutObj = new Date(j.checkout);
            checkout = isNaN(checkoutObj.getTime()) ? j.checkout : checkoutObj.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
        var statusLower = j.status ? j.status.toLowerCase().trim() : '';
        var badge = statusLower === 'selesai' ? '<span class="badge-status selesai">Selesai</span>' :
                    statusLower === 'batal' ? '<span class="badge-status batal">Batal</span>' :
                    '<span class="badge-status terjadwal">Terjadwal</span>';
        var keterangan = j.keterangan || '-';
        var showBtn = (statusLower === 'terjadwal');
        html += `<tr>
            <td><strong>${start + idx + 1}</strong></td>
            <td><strong>${escapeHtml(j.nama_pasien || '-')}</strong></td>
            <td>${checkin}</td>
            <td>${checkout}</td>
            <td>${badge}</td>
            <td style="max-width:150px;word-wrap:break-word;">${escapeHtml(keterangan)}</td>
            <td style="text-align:center;">
                ${showBtn ? `<button class="btn-selesai" data-id="${j.id_checkup}"><i class="fas fa-check"></i> Selesai</button>` : '<span style="color:var(--text-muted);font-size:0.8rem;">-</span>'}
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
    setupTableEvents();
}

function updateJadwalPaginationInfo(total) {
    var totalData = total || jadwalState.total || 0;
    var page = jadwalState.page, limit = jadwalState.limit;
    var from = totalData > 0 ? (page-1)*limit +1 : 0;
    var to = totalData > 0 ? Math.min(page*limit, totalData) : 0;
    document.getElementById('jadwalTotal').innerText = totalData;
    document.getElementById('jadwalFrom').innerText = from;
    document.getElementById('jadwalTo').innerText = to;
    document.getElementById('jadwalTotalBottom').innerText = totalData;
    document.getElementById('jadwalPageInfo').innerText = 'Halaman ' + page + ' dari ' + (jadwalState.totalPages || 1);
    var prevBtn = document.getElementById('jadwalPrevBtn'), nextBtn = document.getElementById('jadwalNextBtn');
    if (prevBtn) prevBtn.disabled = page <= 1 || totalData === 0;
    if (nextBtn) nextBtn.disabled = page >= jadwalState.totalPages || totalData === 0;
}

function refreshJadwal() { jadwalState.page = 1; loadJadwal(); }

function setupJadwalPagination() {
    document.getElementById('jadwalPrevBtn')?.addEventListener('click', () => {
        if (jadwalState.page > 1) { jadwalState.page--; renderJadwalPage(); updateJadwalPaginationInfo(jadwalState.total); }
    });
    document.getElementById('jadwalNextBtn')?.addEventListener('click', () => {
        if (jadwalState.page < jadwalState.totalPages) { jadwalState.page++; renderJadwalPage(); updateJadwalPaginationInfo(jadwalState.total); }
    });
    document.getElementById('jadwalLimit')?.addEventListener('change', function() {
        jadwalState.limit = parseInt(this.value) || 5;
        jadwalState.page = 1;
        jadwalState.totalPages = Math.ceil(jadwalState.total / jadwalState.limit);
        renderJadwalPage();
        updateJadwalPaginationInfo(jadwalState.total);
    });
}

// ==================== EXPORT ====================
window.loadDashboardStats = loadDashboardStats;
window.loadDaftarPasien = loadDaftarPasien;
window.loadJadwal = loadJadwal;
window.updateDeskripsiPasien = updateDeskripsiPasien;
window.dischargePasien = dischargePasien;
window.batalkanPulang = batalkanPulang;
window.selesaikanCheckup = selesaikanCheckup;
window.refreshJadwal = refreshJadwal;
window.showSelesaikanCheckupModal = showSelesaikanCheckupModal;

setupJadwalPagination();

console.log('dashboardDokterController.js loaded - Version 2.9');