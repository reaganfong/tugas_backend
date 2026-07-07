/**
 * Akuntan Dashboard Controller
 * Version: 2.1 - FIXED Jumlah Obat
 */

// ==================== NOTIFIKASI UNTUK TAGIHAN ====================

function showNotifikasiTagihan(message, type) {
    var container = document.getElementById('notificationTagihan');
    if (!container) {
        var tagihanCard = document.querySelector('.card:first-child');
        if (tagihanCard) {
            container = document.createElement('div');
            container.id = 'notificationTagihan';
            container.className = 'notification-container';
            container.style.cssText = 'margin-top: 12px;';
            
            var filterBar = tagihanCard.querySelector('.filter-bar');
            if (filterBar) {
                filterBar.after(container);
            } else {
                var tagihanContainer = tagihanCard.querySelector('#tagihan-container');
                if (tagihanContainer) {
                    tagihanContainer.before(container);
                } else {
                    tagihanCard.appendChild(container);
                }
            }
        }
    }
    
    if (!container) return;
    
    var icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    var classes = {
        success: 'notification-success',
        error: 'notification-error',
        info: 'notification-info'
    };
    
    var notif = document.createElement('div');
    notif.className = 'notification ' + (classes[type] || classes.info);
    
    var progress = document.createElement('div');
    progress.className = 'notification-progress';
    
    notif.innerHTML = 
        '<i class="fas ' + (icons[type] || icons.info) + '"></i>' +
        '<span style="flex:1;">' + message + '</span>' +
        '<button class="close-btn" onclick="this.closest(\'.notification\').classList.add(\'hiding\'); setTimeout(function(){ if(this.parentElement) this.parentElement.remove(); }, 400);"><i class="fas fa-times"></i></button>';
    
    notif.appendChild(progress);
    container.appendChild(notif);
    
    var hideTimeout = setTimeout(function() {
        if (notif.parentNode) {
            notif.classList.add('hiding');
            setTimeout(function() {
                if (notif.parentNode) notif.remove();
            }, 400);
        }
    }, 4500);
    
    var closeBtn = notif.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            clearTimeout(hideTimeout);
        });
    }
}

// ==================== NOTIFIKASI UNTUK FASILITAS ====================

function showNotifikasiFasilitas(message, type) {
    var container = document.getElementById('notificationFasilitas');
    if (!container) {
        var cards = document.querySelectorAll('.card');
        if (cards.length > 1) {
            var fasilitasCard = cards[1];
            container = document.createElement('div');
            container.id = 'notificationFasilitas';
            container.className = 'notification-container';
            container.style.cssText = 'margin-top: 12px;';
            
            var fasilitasContainer = fasilitasCard.querySelector('#fasilitas-container');
            if (fasilitasContainer) {
                fasilitasContainer.before(container);
            } else {
                fasilitasCard.appendChild(container);
            }
        }
    }
    
    if (!container) return;
    
    var icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    var classes = {
        success: 'notification-success',
        error: 'notification-error',
        info: 'notification-info'
    };
    
    var notif = document.createElement('div');
    notif.className = 'notification ' + (classes[type] || classes.info);
    
    var progress = document.createElement('div');
    progress.className = 'notification-progress';
    
    notif.innerHTML = 
        '<i class="fas ' + (icons[type] || icons.info) + '"></i>' +
        '<span style="flex:1;">' + message + '</span>' +
        '<button class="close-btn" onclick="this.closest(\'.notification\').classList.add(\'hiding\'); setTimeout(function(){ if(this.parentElement) this.parentElement.remove(); }, 400);"><i class="fas fa-times"></i></button>';
    
    notif.appendChild(progress);
    container.appendChild(notif);
    
    var hideTimeout = setTimeout(function() {
        if (notif.parentNode) {
            notif.classList.add('hiding');
            setTimeout(function() {
                if (notif.parentNode) notif.remove();
            }, 400);
        }
    }, 4500);
    
    var closeBtn = notif.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            clearTimeout(hideTimeout);
        });
    }
}

// Override showToast dari utils.js
var originalShowToast = window.showToast;
var originalShowSuccess = window.showSuccess;
var originalShowError = window.showError;

window.showToast = function(message, type) {
    showNotifikasiTagihan(message, type);
    if (originalShowToast) originalShowToast(message, type);
};

window.showSuccess = function(message) {
    showNotifikasiTagihan(message, 'success');
    if (originalShowSuccess) originalShowSuccess(message);
};

window.showError = function(message) {
    showNotifikasiTagihan(message, 'error');
    if (originalShowError) originalShowError(message);
};

// ==================== STATE ====================

const AkuntanState = {
    currentFilter: 'belum'
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
    var username = localStorage.getItem('username') || 'Akuntan';
    document.getElementById('namaUser').innerText = username;
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            utils.logout();
        };
    }
    
    await loadAllData();
    
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            AkuntanState.currentFilter = filterStatus.value;
            loadTagihan(filterStatus.value);
        });
    }
    
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    if (addPaymentBtn) addPaymentBtn.onclick = showAddPaymentModal;
});

// ==================== LOAD ALL DATA ====================

async function loadAllData() {
    try {
        showLoading('tagihan-container', 'Memuat tagihan...');
        showLoading('fasilitas-container', 'Memuat fasilitas...');
        showLoading('checkinout-container', 'Memuat riwayat check-in/out...');
        
        const [fasilitas, checkInOut] = await Promise.all([
            apiService.getFasilitas(),
            apiService.getPasienCheckInOut()
        ]);
        
        await loadTagihan(AkuntanState.currentFilter);
        renderFasilitas(fasilitas);
        renderCheckInOut(checkInOut);
        
        hideLoading('tagihan-container');
        hideLoading('fasilitas-container');
        hideLoading('checkinout-container');
        
    } catch (err) {
        console.error(err);
        showNotifikasiTagihan('Gagal memuat data: ' + err.message, 'error');
    }
}

// ==================== TAGIHAN ====================

async function loadTagihan(status = 'belum') {
    const container = document.getElementById('tagihan-container');
    if (!container) return;
    
    try {
        showLoading(container, 'Memuat tagihan...');
        
        const data = await apiService.getTagihanByStatus(status);
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p><i class="fas fa-info-circle"></i> Tidak ada tagihan dengan status tersebut.</p>';
            return;
        }
        
        let html = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Pasien</th>
                            <th>Total Biaya</th>
                            <th>Status</th>
                            <th>Tanggal</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.forEach((t, idx) => {
            // ✅ Hitung ulang total dari rincian yang dikirim backend
            const totalCheckup = parseFloat(t.total_checkup || 0);
            const totalObat = parseFloat(t.total_obat || 0);
            const totalRawatInap = parseFloat(t.total_rawat_inap || 0);
            const totalRincian = totalCheckup + totalObat + totalRawatInap;
            
            // ✅ Gunakan total dari backend (sudah direkalkulasi) atau dari rincian
            const totalBiaya = parseFloat(t.total_biaya || totalRincian);
            
            const statusBadge = t.status === 'lunas' 
                ? '<span class="badge badge-success">Lunas</span>'
                : '<span class="badge badge-danger">Belum Lunas</span>';
            
            // ✅ Debug log
            console.log('[TAGIHAN #' + t.id_tagihan + ']', {
                total_biaya: totalBiaya,
                total_checkup: totalCheckup,
                total_obat: totalObat,
                total_rawat_inap: totalRawatInap,
                total_rincian: totalRincian
            });
            
            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${escapeHtml(t.nama)}</td>
                    <td><strong>${formatCurrency(totalBiaya)}</strong></td>
                    <td>${statusBadge}</td>
                    <td>${formatDate(t.tanggal_tagihan)}</td>
                    <td>
                        <button class="btn-detail" data-id="${t.id_tagihan}" style="background:var(--btn-primary);color:white;border:none;padding:4px 14px;border-radius:20px;font-size:0.75rem;cursor:pointer;transition:0.2s;margin-right:4px;">
                            <i class="fas fa-eye"></i> Detail
                        </button>
                        ${t.status === 'belum' ? `
                            <button class="btn-lunas" data-id="${t.id_tagihan}" style="background:var(--btn-success);color:white;border:none;padding:4px 14px;border-radius:20px;font-size:0.75rem;cursor:pointer;transition:0.2s;">
                                <i class="fas fa-check-circle"></i> Bayar / Lunas
                            </button>
                        ` : `
                            <button class="btn-batalkan-lunas" data-id="${t.id_tagihan}" style="background:var(--btn-warning);color:white;border:none;padding:4px 14px;border-radius:20px;font-size:0.75rem;cursor:pointer;transition:0.2s;">
                                <i class="fas fa-undo"></i> Batalkan Lunas
                            </button>
                        `}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Event listeners
        container.querySelectorAll('.btn-detail').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                await showDetailTagihan(id);
            });
        });
        
        container.querySelectorAll('.btn-lunas').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (confirm('Tandai tagihan ini sebagai lunas?')) {
                    try {
                        await apiService.updateTagihanStatus(id, 'lunas');
                        showNotifikasiTagihan('Status tagihan diubah menjadi lunas!', 'success');
                        await loadTagihan(AkuntanState.currentFilter);
                    } catch (err) {
                        showNotifikasiTagihan(err.message, 'error');
                    }
                }
            });
        });
        
        container.querySelectorAll('.btn-batalkan-lunas').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (confirm('Batalkan status lunas tagihan ini?')) {
                    try {
                        await apiService.batalkanLunasTagihan(id);
                        showNotifikasiTagihan('Status tagihan dikembalikan ke belum lunas!', 'success');
                        await loadTagihan(AkuntanState.currentFilter);
                    } catch (err) {
                        showNotifikasiTagihan(err.message, 'error');
                    }
                }
            });
        });
        
        hideLoading(container);
        
    } catch (err) {
        container.innerHTML = `<p class="error"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</p>`;
    }
}

// ==================== FASILITAS ====================

function renderFasilitas(data) {
    const container = document.getElementById('fasilitas-container');
    if (!container) return;
    
    const fasilitas = data.fasilitas || [];
    
    if (fasilitas.length === 0) {
        container.innerHTML = '<p><i class="fas fa-info-circle"></i> Tidak ada data fasilitas.</p>';
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nama Fasilitas</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    fasilitas.forEach(f => {
        const statusBadge = f.status === 'rusak' 
            ? '<span class="badge badge-danger">Rusak</span>'
            : '<span class="badge badge-success">Baik</span>';
        
        html += `
            <tr>
                <td>${escapeHtml(f.nama_fasilitas)}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-toggle-fasilitas" data-id="${f.id_fasilitas}">
                        <i class="fas fa-exchange-alt"></i> Toggle Status
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
    
    container.querySelectorAll('.btn-toggle-fasilitas').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (confirm('Ubah status fasilitas ini?')) {
                try {
                    await apiService.toggleFasilitasStatus(id);
                    showNotifikasiFasilitas('Status fasilitas diubah!', 'success');
                    const newData = await apiService.getFasilitas();
                    renderFasilitas(newData);
                } catch (err) {
                    showNotifikasiFasilitas(err.message, 'error');
                }
            }
        });
    });
}

// ==================== CHECK-IN / CHECK-OUT ====================

function renderCheckInOut(data) {
    const container = document.getElementById('checkinout-container');
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p><i class="fas fa-info-circle"></i> Belum ada riwayat check-in/out.</p>';
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Pasien</th>
                        <th>Dokter</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Biaya</th>
                        <th>Keterangan</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.forEach((c, idx) => {
        var checkin = '-';
        if (c.tanggal && c.jam) {
            var dateStr = c.tanggal;
            var timeStr = c.jam;
            
            if (typeof dateStr === 'object' && dateStr instanceof Date) {
                dateStr = dateStr.toISOString().split('T')[0];
            } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            }
            
            var fullDate = dateStr + ' ' + timeStr;
            var dateObj = new Date(fullDate);
            
            if (!isNaN(dateObj.getTime())) {
                checkin = dateObj.toLocaleString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                try {
                    var parts = dateStr.split('-');
                    if (parts.length === 3) {
                        var d = new Date(parts[0], parts[1] - 1, parts[2]);
                        if (!isNaN(d.getTime())) {
                            var hours = timeStr.split(':');
                            d.setHours(parseInt(hours[0]) || 0, parseInt(hours[1]) || 0);
                            checkin = d.toLocaleString('id-ID', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        }
                    }
                } catch(e) {
                    checkin = dateStr + ' ' + timeStr;
                }
            }
        }
        
        var checkout = '-';
        if (c.checkout) {
            var checkoutDate = new Date(c.checkout);
            if (!isNaN(checkoutDate.getTime())) {
                checkout = checkoutDate.toLocaleString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                checkout = c.checkout;
            }
        }
        
        html += `
            <tr>
                <td>${idx + 1}</td>
                <td>${escapeHtml(c.nama_pasien)}</td>
                <td>${escapeHtml(c.nama_dokter)}</td>
                <td>${checkin}</td>
                <td>${checkout}</td>
                <td>${formatCurrency(c.biaya_checkup || 0)}</td>
                <td>${escapeHtml(truncateText(c.keterangan || '', 30))}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// ==================== MODAL TAMBAH TAGIHAN ====================

function showAddPaymentModal() {
    var allPatients = [];
    
    function renderPatientTable(patients) {
        var tbody = document.getElementById('modalPatientTable');
        if (!tbody) return;
        
        if (!patients || patients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted);">Tidak ada data pasien.</td></tr>';
            return;
        }
        
        var html = '';
        patients.forEach(function(p, idx) {
            var status = p.msh_dirawat ? 'Dirawat' : 'Pulang';
            var statusClass = p.msh_dirawat ? 'badge-success' : 'badge-secondary';
            
            var lastCheckin = '-';
            if (p.tanggal && p.jam) {
                var dateObj = new Date(p.tanggal + ' ' + p.jam);
                if (!isNaN(dateObj.getTime())) {
                    lastCheckin = dateObj.toLocaleString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else {
                    lastCheckin = p.tanggal;
                }
            }
            
            html += `
                <tr onclick="pilihPasien('${p.id_pasien}', '${escapeHtml(p.nama)}')" style="cursor:pointer;">
                    <td><strong>${idx + 1}</strong></td>
                    <td>${escapeHtml(p.nama || '-')}</td>
                    <td>${lastCheckin}</td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                    <td><button style="background:var(--btn-primary);color:white;border:none;padding:4px 12px;border-radius:12px;cursor:pointer;font-size:0.75rem;"><i class="fas fa-check"></i> Pilih</button></td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    function searchPatient() {
        var keyword = document.getElementById('modalSearchInput').value.trim().toLowerCase();
        if (!keyword) {
            renderPatientTable(allPatients);
            return;
        }
        var filtered = allPatients.filter(function(p) {
            var nama = (p.nama || '').toLowerCase();
            var id = String(p.id_pasien);
            return nama.includes(keyword) || id.includes(keyword);
        });
        renderPatientTable(filtered);
    }
    
    window.pilihPasien = function(id, nama) {
        document.getElementById('modal_id_pasien').value = id;
        document.getElementById('modal_nama_pasien').innerHTML = '<i class="fas fa-check-circle" style="color:var(--badge-success-text);"></i> ' + escapeHtml(nama) + ' (ID: ' + id + ')';
        document.getElementById('modal_nama_pasien').style.color = 'var(--badge-success-text)';
        document.getElementById('modal_nama_pasien').style.fontWeight = '600';
    };
    
    window.searchPatient = searchPatient;
    window.renderPatientTable = renderPatientTable;
    
    var modalOverlay = document.createElement('div');
    modalOverlay.id = 'paymentModal';
    modalOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;justify-content:center;align-items:center;';
    
    var modalBox = document.createElement('div');
    modalBox.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:750px;width:95%;max-height:90vh;overflow-y:auto;';
    
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid var(--btn-primary);padding-bottom:10px;';
    header.innerHTML = '<h2 style="margin:0;color:var(--text-secondary);"><i class="fas fa-plus-circle"></i> Tambah Tagihan Baru</h2><span onclick="document.getElementById(\'paymentModal\').remove()" style="font-size:24px;cursor:pointer;color:var(--text-muted);padding:0 8px;"><i class="fas fa-times"></i></span>';
    modalBox.appendChild(header);
    
    var body = document.createElement('div');
    body.innerHTML = `
        <div style="margin-bottom:16px;">
            <label style="font-weight:600;font-size:0.9rem;color:var(--text-secondary);display:block;margin-bottom:8px;">
                <i class="fas fa-search"></i> Cari Pasien
            </label>
            <div style="display:flex;gap:10px;">
                <input type="text" id="modalSearchInput" placeholder="Cari berdasarkan nama atau ID..." style="flex:1;padding:10px 14px;border:1px solid var(--border-color);border-radius:8px;font-size:0.9rem;">
                <button onclick="searchPatient()" style="background:var(--btn-primary);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600;">
                    <i class="fas fa-search"></i> Cari
                </button>
                <button onclick="document.getElementById('modalSearchInput').value=''; searchPatient();" style="background:var(--bg-secondary);color:var(--text-secondary);border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600;">
                    <i class="fas fa-undo"></i> Reset
                </button>
            </div>
        </div>
        <div style="margin-bottom:16px;max-height:200px;overflow-y:auto;border:1px solid var(--border-light);border-radius:8px;">
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                <thead style="position:sticky;top:0;background:var(--bg-table-header);z-index:2;">
                    <tr>
                        <th style="padding:10px 12px;text-align:left;font-weight:600;color:var(--text-secondary);border-bottom:2px solid var(--border-color);">No</th>
                        <th style="padding:10px 12px;text-align:left;font-weight:600;color:var(--text-secondary);border-bottom:2px solid var(--border-color);">Nama</th>
                        <th style="padding:10px 12px;text-align:left;font-weight:600;color:var(--text-secondary);border-bottom:2px solid var(--border-color);">Check-in Terakhir</th>
                        <th style="padding:10px 12px;text-align:left;font-weight:600;color:var(--text-secondary);border-bottom:2px solid var(--border-color);">Status</th>
                        <th style="padding:10px 12px;text-align:left;font-weight:600;color:var(--text-secondary);border-bottom:2px solid var(--border-color);">Aksi</th>
                    </tr>
                </thead>
                <tbody id="modalPatientTable">
                    <tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Memuat...</td></tr>
                </tbody>
            </table>
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;">
            <i class="fas fa-info-circle"></i> Klik tombol "Pilih" untuk memilih pasien
        </div>
        <hr style="border:1px solid var(--border-color);margin:16px 0;">
        <div style="margin-bottom:16px;">
            <label style="font-weight:600;font-size:0.9rem;color:var(--text-secondary);display:block;margin-bottom:8px;">
                <i class="fas fa-user"></i> Pasien Terpilih
            </label>
            <div id="modal_nama_pasien" style="padding:10px 14px;background:var(--bg-secondary);border-radius:8px;border:1px solid var(--border-light);color:var(--text-muted);font-weight:500;">Belum ada pasien dipilih</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
                <label style="font-weight:600;font-size:0.9rem;color:var(--text-secondary);display:block;margin-bottom:8px;">
                    ID Pasien <span style="color:red;">*</span>
                </label>
                <input type="number" id="modal_id_pasien" min="1" placeholder="Masukkan ID pasien" style="width:100%;padding:10px 14px;border:1px solid var(--border-color);border-radius:8px;font-size:0.9rem;">
            </div>
            <div>
                <label style="font-weight:600;font-size:0.9rem;color:var(--text-secondary);display:block;margin-bottom:8px;">
                    Total Biaya (Rp) <span style="color:red;">*</span>
                </label>
                <input type="number" id="modal_total_biaya" min="0" step="1000" placeholder="Masukkan total biaya" style="width:100%;padding:10px 14px;border:1px solid var(--border-color);border-radius:8px;font-size:0.9rem;">
            </div>
        </div>
        <div style="margin-top:16px;">
            <label style="font-weight:600;font-size:0.9rem;color:var(--text-secondary);display:block;margin-bottom:8px;">
                <i class="fas fa-comment"></i> Keterangan
            </label>
            <textarea id="modal_keterangan" rows="2" placeholder="Keterangan tagihan (opsional)" style="width:100%;padding:10px 14px;border:1px solid var(--border-color);border-radius:8px;font-size:0.9rem;resize:vertical;"></textarea>
        </div>
    `;
    modalBox.appendChild(body);
    
    var footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color);';
    footer.innerHTML = `
        <button id="modalSubmitBtn" style="flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
            <i class="fas fa-save"></i> Simpan Tagihan
        </button>
        <button onclick="document.getElementById('paymentModal').remove();" style="padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);">
            <i class="fas fa-times"></i> Batal
        </button>
    `;
    modalBox.appendChild(footer);
    
    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);
    
    apiService.getPasien()
        .then(function(data) {
            allPatients = data || [];
            return apiService.getPasienCheckInOut();
        })
        .then(function(checkInOut) {
            var checkinMap = {};
            if (checkInOut && checkInOut.length > 0) {
                checkInOut.forEach(function(c) {
                    if (!checkinMap[c.id_pasien]) {
                        checkinMap[c.id_pasien] = { tanggal: c.tanggal || null, jam: c.jam || null };
                    }
                });
            }
            allPatients.forEach(function(p) {
                if (checkinMap[p.id_pasien]) {
                    p.tanggal = checkinMap[p.id_pasien].tanggal;
                    p.jam = checkinMap[p.id_pasien].jam;
                }
            });
            renderPatientTable(allPatients);
        })
        .catch(function(err) {
            document.getElementById('modalPatientTable').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--badge-danger-text);">Error: ' + escapeHtml(err.message) + '</td></tr>';
        });
    
    document.getElementById('modalSubmitBtn').onclick = async function() {
        var idPasien = parseInt(document.getElementById('modal_id_pasien').value);
        var totalBiaya = parseFloat(document.getElementById('modal_total_biaya').value);
        var keterangan = document.getElementById('modal_keterangan').value;
        
        if (!idPasien || idPasien <= 0) {
            showNotifikasiTagihan('ID Pasien harus valid!', 'error');
            return;
        }
        if (!totalBiaya || totalBiaya <= 0) {
            showNotifikasiTagihan('Total Biaya harus valid!', 'error');
            return;
        }
        
        var btn = document.getElementById('modalSubmitBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        try {
            await apiService.addTagihan({
                id_pasien: idPasien,
                total_biaya: totalBiaya,
                keterangan: keterangan || ''
            });
            showNotifikasiTagihan('Tagihan berhasil ditambahkan!', 'success');
            document.getElementById('paymentModal').remove();
            await loadTagihan(AkuntanState.currentFilter);
        } catch (err) {
            showNotifikasiTagihan(err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Simpan Tagihan';
        }
    };
    
    modalOverlay.onclick = function(e) {
        if (e.target === modalOverlay) {
            document.getElementById('paymentModal').remove();
        }
    };
}

// ==================== DETAIL TAGIHAN ====================

async function showDetailTagihan(idTagihan) {
    try {
        var data = await apiService.getDetailTagihan(idTagihan);
        console.log('[DETAIL] Data:', data);
        
        var tagihan = data.tagihan;
        var rincian = data.rincian;
        var totalRincian = data.total_rincian || 0;
        
        var overlay = document.createElement('div');
        overlay.id = 'detailModal';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;justify-content:center;align-items:center;';
        
        var box = document.createElement('div');
        box.style.cssText = 'background:white;border-radius:16px;padding:24px;max-width:800px;width:95%;max-height:90vh;overflow-y:auto;';
        
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:2px solid var(--btn-primary);padding-bottom:10px;';
        header.innerHTML = `
            <h2 style="margin:0;color:var(--text-secondary);font-size:1.3rem;">
                <i class="fas fa-receipt" style="color:var(--btn-primary);margin-right:8px;"></i> 
                Detail Tagihan #${shortId(tagihan.id_tagihan)}
            </h2>
            <button onclick="document.getElementById('detailModal').remove()" style="font-size:24px;cursor:pointer;color:var(--text-muted);background:none;border:none;transition:0.2s;">
                <i class="fas fa-times"></i>
            </button>
        `;
        box.appendChild(header);
        
        var info = document.createElement('div');
        info.style.cssText = 'background:var(--bg-table-header);padding:12px 16px;border-radius:8px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px;';
        info.innerHTML = `
            <div><strong>Pasien:</strong> <span style="font-weight:600;">#${shortId(tagihan.id_pasien)}</span> - ${escapeHtml(tagihan.nama)}</div>
            <div><strong>Status:</strong> ${tagihan.status === 'lunas' ? '<span style="color:var(--badge-success-text);">Lunas</span>' : '<span style="color:var(--badge-danger-text);">Belum Lunas</span>'}</div>
            <div><strong>Total Tagihan:</strong> <span style="font-weight:600;">${formatCurrency(tagihan.total_biaya)}</span></div>
            <div><strong>Tanggal:</strong> ${formatDate(tagihan.tanggal_tagihan)}</div>
        `;
        box.appendChild(info);
        
        var detailHtml = '<div style="margin-top:12px;">';
        
        // ===== CHECKUP =====
        var totalCheckup = rincian.checkup.total || 0;
        detailHtml += `
            <h4 style="color:var(--text-secondary);margin:12px 0 8px 0;border-bottom:1px solid var(--border-color);padding-bottom:4px;font-size:1rem;">
                <i class="fas fa-stethoscope" style="color:var(--btn-primary);margin-right:8px;"></i> Biaya Checkup
                <span style="float:right;font-weight:600;">${formatCurrency(totalCheckup)}</span>
            </h4>
        `;
        
        if (rincian.checkup.items && rincian.checkup.items.length > 0) {
            detailHtml += '<table style="width:100%;font-size:0.85rem;border-collapse:collapse;">';
            detailHtml += '<tr style="background:var(--bg-secondary);"><th style="padding:6px 10px;text-align:left;">Tanggal</th><th style="padding:6px 10px;text-align:left;">Dokter</th><th style="padding:6px 10px;text-align:right;">Biaya</th></tr>';
            rincian.checkup.items.forEach(function(c) {
                var tanggal = c.tanggal ? formatDate(c.tanggal) : '-';
                var jam = c.jam || '';
                detailHtml += `
                    <tr>
                        <td style="padding:4px 10px;border-bottom:1px solid var(--border-light);">${tanggal} ${jam}</td>
                        <td style="padding:4px 10px;border-bottom:1px solid var(--border-light);">${escapeHtml(c.nama_dokter || '-')}</td>
                        <td style="padding:4px 10px;border-bottom:1px solid var(--border-light);text-align:right;">${formatCurrency(c.biaya_checkup)}</td>
                    </tr>
                `;
            });
            detailHtml += '</table>';
        } else {
            detailHtml += '<p style="color:var(--text-muted);font-size:0.85rem;"><i class="fas fa-info-circle"></i> Tidak ada biaya checkup.</p>';
        }
        
        // ===== RAWAT INAP =====
        var totalRawatInap = rincian.rawat_inap.total || 0;
        detailHtml += `
            <h4 style="color:var(--text-secondary);margin:16px 0 8px 0;border-bottom:1px solid var(--border-color);padding-bottom:4px;font-size:1rem;">
                <i class="fas fa-bed" style="color:var(--btn-primary);margin-right:8px;"></i> Biaya Rawat Inap
                <span style="float:right;font-weight:600;">${formatCurrency(totalRawatInap)}</span>
            </h4>
        `;
        
        if (rincian.rawat_inap.items && rincian.rawat_inap.items.length > 0) {
            detailHtml += '<table style="width:100%;font-size:0.85rem;border-collapse:collapse;">';
            detailHtml += '<tr style="background:var(--bg-secondary);"><th style="padding:6px 10px;text-align:left;">Ruangan</th><th style="padding:6px 10px;text-align:left;">Hari</th><th style="padding:6px 10px;text-align:right;">Biaya</th></tr>';
            rincian.rawat_inap.items.forEach(function(r) {
                detailHtml += `
                    <tr>
                        <td style="padding:4px 10px;border-bottom:1px solid var(--border-light);">${escapeHtml(r.nama_ruangan)} (No. ${r.nomor_ruangan})</td>
                        <td style="padding:4px 10px;border-bottom:1px solid var(--border-light);">${r.lama_inap} hari</td>
                        <td style="padding:4px 10px;border-bottom:1px solid var(--border-light);text-align:right;">${formatCurrency(r.total_biaya_ruangan)}</td>
                    </tr>
                `;
            });
            detailHtml += '</table>';
        } else {
            detailHtml += '<p style="color:var(--text-muted);font-size:0.85rem;"><i class="fas fa-info-circle"></i> Tidak ada biaya rawat inap.</p>';
        }
        
        // ===== OBAT =====
        var totalObat = rincian.obat.total || 0;
        detailHtml += `
            <h4 style="color:var(--text-secondary);margin:16px 0 8px 0;border-bottom:1px solid var(--border-color);padding-bottom:4px;font-size:1rem;">
                <i class="fas fa-pills" style="color:var(--btn-primary);margin-right:8px;"></i> Biaya Obat
                <span style="float:right;font-weight:600;">${formatCurrency(totalObat)}</span>
            </h4>
        `;
        
        if (rincian.obat.items && rincian.obat.items.length > 0) {
            detailHtml += '<table style="width:100%;font-size:0.85rem;border-collapse:collapse;">';
            detailHtml += '<tr style="background:var(--bg-secondary);"><th style="padding:6px 10px;text-align:left;">Nama Obat</th><th style="padding:6px 10px;text-align:center;">Jumlah</th><th style="padding:6px 10px;text-align:right;">Harga</th><th style="padding:6px 10px;text-align:right;">Total</th></tr>';
            rincian.obat.items.forEach(function(o) {
                // ===== PERBAIKAN: Pakai o.jumlah dari database =====
                var jumlah = parseInt(o.jumlah) || 1;
                var totalHarga = parseFloat(o.total_harga || 0);
                if (totalHarga === 0) {
                    totalHarga = parseFloat(o.harga || 0) * jumlah;
                }
                detailHtml += `
                    <tr>
                        <td style="padding:4px 10px;border-bottom:1px solid var(--border-light);">${escapeHtml(o.nama_obat)}</td>
                        <td style="padding:4px 10px;border-bottom:1px solid var(--border-light);text-align:center;">${jumlah}</td>
                        <td style="padding:4px 10px;border-bottom:1px solid var(--border-light);text-align:right;">${formatCurrency(o.harga)}</td>
                        <td style="padding:4px 10px;border-bottom:1px solid var(--border-light);text-align:right;">${formatCurrency(totalHarga)}</td>
                    </tr>
                `;
            });
            detailHtml += '</table>';
        } else {
            detailHtml += '<p style="color:var(--text-muted);font-size:0.85rem;"><i class="fas fa-info-circle"></i> Tidak ada biaya obat.</p>';
        }
        
        // ===== TOTAL RINCIAN =====
        var isMatch = Math.abs(totalRincian - parseFloat(tagihan.total_biaya)) <= 1000;
        detailHtml += `
            <div style="margin-top:16px;padding-top:12px;border-top:2px solid var(--border-color);text-align:right;font-size:1.1rem;font-weight:700;color:var(--text-secondary);">
                Total Rincian: ${formatCurrency(totalRincian)}
            </div>
            <div style="text-align:right;font-size:0.85rem;color:var(--text-muted);">
                <i class="fas fa-info-circle"></i> Total Tagihan: ${formatCurrency(tagihan.total_biaya)}
                ${isMatch ? 
                    '<span style="color:var(--badge-success-text);"> (Sesuai)</span>' : 
                    '<span style="color:var(--badge-danger-text);"> (Tidak sesuai)</span>'}
            </div>
        `;
        
        detailHtml += '</div>';
        
        var detailDiv = document.createElement('div');
        detailDiv.innerHTML = detailHtml;
        box.appendChild(detailDiv);
        
        var footer = document.createElement('div');
        footer.style.cssText = 'display:flex;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color);';
        footer.innerHTML = `
            <button onclick="document.getElementById('detailModal').remove();" style="flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:0.2s;">
                <i class="fas fa-times"></i> Tutup
            </button>
        `;
        box.appendChild(footer);
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                overlay.remove();
            }
        };
        
    } catch (err) {
        console.error('[ERROR] showDetailTagihan:', err);
        showNotifikasiTagihan('Gagal memuat detail: ' + err.message, 'error');
    }
}

// ==================== EXPORT ====================

window.loadTagihan = loadTagihan;
window.loadAllData = loadAllData;
window.renderFasilitas = renderFasilitas;
window.renderCheckInOut = renderCheckInOut;
window.showAddPaymentModal = showAddPaymentModal;
window.showDetailTagihan = showDetailTagihan;
window.searchPatient = function() {};
window.renderPatientTable = function() {};
window.pilihPasien = function() {};