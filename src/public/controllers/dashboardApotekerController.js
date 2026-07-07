/**
 * Apoteker Dashboard Controller
 * Version: 2.2 - FIXED REDIRECT
 */

// ==================== NOTIFIKASI DI BAWAH JUDUL CARD ====================

function showNotifikasiApoteker(message, type) {
    var container = document.getElementById('notificationApoteker');
    if (!container) {
        var card = document.querySelector('.card');
        if (card) {
            container = document.createElement('div');
            container.id = 'notificationApoteker';
            container.className = 'notification-container';
            container.style.cssText = 'margin-top: 12px; margin-bottom: 12px;';
            
            var flexDiv = card.querySelector('.flex-between');
            if (flexDiv) {
                flexDiv.after(container);
            } else {
                var cardTitle = card.querySelector('h2');
                if (cardTitle) {
                    cardTitle.after(container);
                } else {
                    card.prepend(container);
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

// Override fungsi dari utils.js
var originalShowSuccess = window.showSuccess;
var originalShowError = window.showError;
var originalShowToast = window.showToast;

window.showSuccess = function(message) {
    showNotifikasiApoteker(message, 'success');
    if (originalShowSuccess) originalShowSuccess(message);
};

window.showError = function(message) {
    showNotifikasiApoteker(message, 'error');
    if (originalShowError) originalShowError(message);
};

window.showToast = function(message, type) {
    showNotifikasiApoteker(message, type);
    if (originalShowToast) originalShowToast(message, type);
};

window.showInfo = function(message) {
    showNotifikasiApoteker(message, 'info');
};

// ==================== HELPER FUNCTIONS ====================

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

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async function() {
    var username = localStorage.getItem('username') || 'Apoteker';
    document.getElementById('namaUser').innerText = username;

    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            utils.logout();
        };
    }

    var tambahObatBtn = document.getElementById('tambahObatBtn');
    if (tambahObatBtn) {
        tambahObatBtn.onclick = showTambahObatModal;
    }

    await loadStokObat();
    await loadRekomendasiObat();
});

// ==================== LOAD STOK OBAT ====================

async function loadStokObat() {
    var tbodyTersedia = document.getElementById('tbodyObatTersedia');
    var tbodyHabis = document.getElementById('tbodyObatHabis');
    
    if (!tbodyTersedia || !tbodyHabis) return;
    
    try {
        tbodyTersedia.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i> Memuat...</td></tr>';
        tbodyHabis.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i> Memuat...</td></tr>';
        
        var obatList = await apiService.getObat();
        console.log('[APOTEKER] Obat loaded:', obatList);
        
        if (!obatList || !Array.isArray(obatList)) {
            tbodyTersedia.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: Format data tidak valid</td></tr>';
            tbodyHabis.innerHTML = '';
            return;
        }
        
        var obatTersedia = obatList.filter(function(o) { return o.stok > 0; });
        var obatHabis = obatList.filter(function(o) { return o.stok === 0; });
        
        var countTersedia = document.getElementById('obatTersediaCount');
        var countHabis = document.getElementById('obatHabisCount');
        
        if (countTersedia) countTersedia.innerText = '(' + obatTersedia.length + ')';
        if (countHabis) countHabis.innerText = '(' + obatHabis.length + ')';
        
        if (obatTersedia.length === 0) {
            tbodyTersedia.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted);"><i class="fas fa-info-circle"></i> Tidak ada data obat tersedia.</td></tr>';
        } else {
            var htmlTersedia = renderObatRows(obatTersedia);
            tbodyTersedia.innerHTML = htmlTersedia;
        }
        
        if (obatHabis.length === 0) {
            tbodyHabis.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--badge-success-text);"><i class="fas fa-check-circle"></i> Semua obat tersedia</td></tr>';
        } else {
            var htmlHabis = renderObatRows(obatHabis);
            tbodyHabis.innerHTML = htmlHabis;
        }
        
        setupObatTableEvents();
        
    } catch (err) {
        console.error('[APOTEKER] Error:', err);
        tbodyTersedia.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--badge-danger-text);"><i class="fas fa-exclamation-circle"></i> Error: ' + escapeHtml(err.message) + '</td></tr>';
        tbodyHabis.innerHTML = '';
    }
}

// ==================== REKOMENDASI OBAT DARI DOKTER ====================

async function loadRekomendasiObat() {
    var container = document.getElementById('rekomendasiObatContainer');
    if (!container) {
        console.error('[APOTEKER] rekomendasiObatContainer tidak ditemukan!');
        return;
    }
    
    try {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Memuat rekomendasi obat...</div>';
        
        console.log('[APOTEKER] Memanggil apiService.getCheckupRekomendasi()');
        var data = await apiService.getCheckupRekomendasi();
        console.log('[APOTEKER] Data rekomendasi obat:', data);
        console.log('[APOTEKER] Jumlah data:', data.length);
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:30px;color:var(--text-muted);">
                    <i class="fas fa-check-circle" style="font-size:2rem;display:block;margin-bottom:8px;color:var(--badge-success-text);"></i>
                    Tidak ada rekomendasi obat dari dokter.
                </div>
            `;
            return;
        }
        
        var html = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Pasien</th>
                            <th>Dokter</th>
                            <th>Rekomendasi Obat</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.forEach(function(c, idx) {
            console.log('[APOTEKER] Render rekomendasi:', c.id_checkup, c.nama_pasien, c.rekomendasi_obat);
            
            var statusObat = c.total_obat_diproses > 0 
                ? '<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:0.7rem;font-weight:600;background:var(--badge-success-bg);color:var(--badge-success-text);">Sudah Diproses</span>'
                : '<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:0.7rem;font-weight:600;background:var(--badge-warning-bg);color:var(--badge-warning-text);">Menunggu</span>';
            
            html += `
                <tr>
                    <td><strong>${idx + 1}</strong></td>
                    <td>${escapeHtml(c.nama_pasien)}</td>
                    <td>${escapeHtml(c.nama_dokter)}</td>
                    <td style="max-width:200px;word-wrap:break-word;">${escapeHtml(c.rekomendasi_obat || '-')}</td>
                    <td>${statusObat}</td>
                    <td>
                        ${c.total_obat_diproses === 0 ? `
                            <button class="btn-proses-obat" data-id="${c.id_checkup}" data-pasien="${escapeHtml(c.nama_pasien)}" style="background:var(--btn-primary);color:white;border:none;padding:4px 14px;border-radius:20px;font-size:0.75rem;cursor:pointer;transition:0.2s;">
                                <i class="fas fa-prescription"></i> Proses Obat
                            </button>
                        ` : '<span style="color:var(--text-muted);font-size:0.8rem;">Sudah diproses</span>'}
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
        
        container.querySelectorAll('.btn-proses-obat').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idCheckup = this.dataset.id;
                var namaPasien = this.dataset.pasien;
                showProsesObatModal(idCheckup, namaPasien);
            });
        });
        
        console.log('[APOTEKER] Rekomendasi obat berhasil dirender!');
        
    } catch (err) {
        console.error('[APOTEKER] Error loadRekomendasiObat:', err);
        container.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--badge-danger-text);background:var(--badge-danger-bg);border-radius:8px;">
                <i class="fas fa-exclamation-circle"></i> 
                Error: ${err.message}
            </div>
        `;
    }
}

// ==================== MODAL PROSES OBAT ====================

function showProsesObatModal(idCheckup, namaPasien) {
    var overlay = document.createElement('div');
    overlay.id = 'prosesObatModal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;justify-content:center;align-items:center;';
    
    var box = document.createElement('div');
    box.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:650px;width:95%;max-height:90vh;overflow-y:auto;';
    
    box.innerHTML = `
        <h2 style="margin:0 0 8px 0;color:var(--text-secondary);">
            <i class="fas fa-prescription" style="color:var(--btn-primary);"></i> Proses Obat
        </h2>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px;">
            Pasien: <strong>${escapeHtml(namaPasien)}</strong> (ID Checkup: ${idCheckup})
        </p>
        <div style="margin-bottom:16px;">
            <label style="display:block;font-weight:600;font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fas fa-pills"></i> Pilih Obat <span style="color:red;">*</span>
            </label>
            <select id="obatSelect" style="width:100%;padding:10px 14px;border:1px solid var(--border-color);border-radius:8px;font-size:0.9rem;">
                <option value="">-- Pilih Obat --</option>
            </select>
        </div>
        <div style="margin-bottom:16px;">
            <label style="display:block;font-weight:600;font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fas fa-hashtag"></i> Jumlah <span style="color:red;">*</span>
            </label>
            <input type="number" id="jumlahObat" min="1" value="1" style="width:100%;padding:10px 14px;border:1px solid var(--border-color);border-radius:8px;font-size:0.9rem;">
        </div>
        <div style="display:flex;gap:12px;">
            <button id="btnProsesObatConfirm" style="flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
                <i class="fas fa-save"></i> Proses Obat
            </button>
            <button onclick="document.getElementById('prosesObatModal').remove()" style="padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);">
                <i class="fas fa-times"></i> Batal
            </button>
        </div>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    apiService.getObat()
        .then(function(obatList) {
            var select = document.getElementById('obatSelect');
            select.innerHTML = '<option value="">-- Pilih Obat --</option>';
            obatList.forEach(function(obat, idx) {
                var opt = document.createElement('option');
                opt.value = obat.id_obat;
                opt.textContent = obat.nama_obat + ' (Stok: ' + obat.stok + ', Harga: ' + formatCurrency(obat.harga || 0) + ')';
                if (obat.stok <= 0) {
                    opt.disabled = true;
                    opt.textContent += ' [HABIS]';
                }
                select.appendChild(opt);
            });
        })
        .catch(function(err) {
            showNotifikasiApoteker('Gagal load obat: ' + err.message, 'error');
        });
    
    document.getElementById('btnProsesObatConfirm').addEventListener('click', async function() {
        var idObat = document.getElementById('obatSelect').value;
        var jumlah = parseInt(document.getElementById('jumlahObat').value);
        
        if (!idObat) {
            showNotifikasiApoteker('Pilih obat terlebih dahulu!', 'error');
            return;
        }
        if (!jumlah || jumlah < 1) {
            showNotifikasiApoteker('Jumlah minimal 1!', 'error');
            return;
        }
        
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        
        try {
            await apiService.kurangiStokObat(idObat, jumlah, idCheckup);
            
            showNotifikasiApoteker('Obat berhasil diproses! Stok berkurang dan riwayat tercatat.', 'success');
            document.getElementById('prosesObatModal').remove();
            
            await loadRekomendasiObat();
            await loadStokObat();
            
        } catch (err) {
            showNotifikasiApoteker('Error: ' + err.message, 'error');
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-save"></i> Proses Obat';
        }
    });
}

// ==================== RENDER OBAT ROWS ====================

function renderObatRows(obatList) {
    var html = '';
    obatList.forEach(function(obat, idx) {
        var statusStok = '';
        var statusColor = '';
        if (obat.stok <= 0) {
            statusStok = 'Habis';
            statusColor = '#dc2626';
        } else if (obat.stok <= (obat.batas_notifikasi || 10)) {
            statusStok = 'Menipis';
            statusColor = '#f59e0b';
        } else {
            statusStok = 'Aman';
            statusColor = '#10b981';
        }
        
        var tanggalRestok = '-';
        if (obat.tanggal_restok_terakhir) {
            var dateObj = new Date(obat.tanggal_restok_terakhir);
            if (!isNaN(dateObj.getTime())) {
                tanggalRestok = dateObj.toLocaleString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } else {
                tanggalRestok = obat.tanggal_restok_terakhir;
            }
        }
        
        html += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${escapeHtml(obat.nama_obat)}</strong></td>
                <td>${obat.stok}</td>
                <td>${formatCurrency(obat.harga || 0)}</td>
                <td><span style="color:${statusColor};font-weight:600;">${statusStok}</span></td>
                <td>${tanggalRestok}</td>
                <td>
                    <button class="btn-tambah" data-id="${obat.id_obat}" data-nama="${escapeHtml(obat.nama_obat)}" style="background:var(--btn-success);color:white;border:none;padding:4px 12px;border-radius:20px;font-size:0.75rem;cursor:pointer;transition:0.2s;">
                        <i class="fas fa-plus-circle"></i> Tambah
                    </button>
                    <button class="btn-buang" data-id="${obat.id_obat}" data-nama="${escapeHtml(obat.nama_obat)}" style="background:var(--btn-danger);color:white;border:none;padding:4px 12px;border-radius:20px;font-size:0.75rem;cursor:pointer;transition:0.2s;">
                        <i class="fas fa-trash-alt"></i> Buang
                    </button>
                </td>
            </tr>
        `;
    });
    return html;
}

// ==================== SETUP OBAT TABLE EVENTS ====================

function setupObatTableEvents() {
    document.removeEventListener('click', handleObatClick);
    document.addEventListener('click', handleObatClick);
}

function handleObatClick(e) {
    var btn = e.target.closest('.btn-tambah, .btn-buang');
    if (!btn) return;
    
    var id = btn.dataset.id;
    var nama = btn.dataset.nama;
    
    console.log('[APOTEKER] Tombol diklik:', btn.className, 'ID:', id, 'Nama:', nama);
    
    if (btn.classList.contains('btn-tambah')) {
        showStokModal('tambah', id, nama);
    } else if (btn.classList.contains('btn-buang')) {
        showStokModal('buang', id, nama);
    }
}

// ==================== STOK MODAL ====================

async function showStokModal(action, idBarang, namaBarang) {
    console.log('[APOTEKER] showStokModal dipanggil:', action, idBarang, namaBarang);
    
    var actions = {
        tambah: {
            title: 'Tambah Stok Obat',
            icon: 'fa-plus-circle',
            submitText: 'Tambah Stok',
            color: var(--badge-success-text),
            onSuccess: 'Stok berhasil ditambahkan!'
        },
        buang: {
            title: 'Buang Obat',
            icon: 'fa-trash-alt',
            submitText: 'Buang Obat',
            color: var(--badge-danger-text),
            onSuccess: 'Obat berhasil dibuang!',
            confirmMessage: 'Apakah Anda yakin ingin membuang obat ini?'
        }
    };
    
    var config = actions[action];
    if (!config) {
        showNotifikasiApoteker('Aksi tidak dikenal', 'error');
        return;
    }
    
    if (action === 'buang') {
        if (!confirm(config.confirmMessage)) return;
    }
    
    var overlay = document.createElement('div');
    overlay.id = 'stokModal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;justify-content:center;align-items:center;';
    
    var box = document.createElement('div');
    box.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:700px;width:95%;max-height:90vh;overflow-y:auto;';
    
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid ' + config.color + ';padding-bottom:10px;';
    header.innerHTML = '<h2 style="margin:0;color:var(--text-secondary);"><i class="fas ' + config.icon + '" style="color:' + config.color + ';"></i> ' + config.title + '</h2><span onclick="document.getElementById(\'stokModal\').remove()" style="font-size:24px;cursor:pointer;color:var(--text-muted);padding:0 8px;"><i class="fas fa-times"></i></span>';
    box.appendChild(header);
    
    var info = document.createElement('div');
    info.style.cssText = 'background:var(--bg-table-header);padding:10px 14px;border-radius:8px;margin-bottom:16px;color:var(--text-secondary);font-weight:500;';
    info.innerHTML = '<i class="fas fa-pills"></i> Obat: <strong>' + escapeHtml(namaBarang) + '</strong> (ID: ' + idBarang + ')';
    box.appendChild(info);
    
    var jumlahGroup = document.createElement('div');
    jumlahGroup.style.cssText = 'margin-bottom:14px;';
    
    var jumlahLabel = document.createElement('label');
    jumlahLabel.style.cssText = 'display:block;font-weight:600;font-size:0.85rem;color:var(--text-secondary);margin-bottom:5px;';
    jumlahLabel.textContent = 'Jumlah: *';
    jumlahGroup.appendChild(jumlahLabel);
    
    var jumlahInput = document.createElement('input');
    jumlahInput.type = 'number';
    jumlahInput.id = 'stok_jumlah';
    jumlahInput.placeholder = 'Masukkan jumlah';
    jumlahInput.min = 1;
    jumlahInput.required = true;
    jumlahInput.style.cssText = 'width:100%;padding:10px 14px;border:1px solid var(--border-color);border-radius:8px;font-size:0.9rem;';
    jumlahGroup.appendChild(jumlahInput);
    box.appendChild(jumlahGroup);
    
    var footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color);';
    footer.innerHTML = `
        <button id="stokSubmitBtn" style="flex:1;background:${config.color};color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
            <i class="fas fa-save"></i> ${config.submitText}
        </button>
        <button onclick="document.getElementById('stokModal').remove();" style="padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);">
            <i class="fas fa-times"></i> Batal
        </button>
    `;
    box.appendChild(footer);
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        var submitBtn = e.target.closest('#stokSubmitBtn');
        if (!submitBtn) return;
        handleSubmit();
    });
    
    async function handleSubmit() {
        var jumlahInput = document.getElementById('stok_jumlah');
        if (!jumlahInput) {
            showNotifikasiApoteker('Error: Input jumlah tidak ditemukan', 'error');
            return;
        }
        
        var jumlah = parseInt(jumlahInput.value);
        
        if (isNaN(jumlah) || jumlah <= 0) {
            showNotifikasiApoteker('Jumlah harus angka positif!', 'error');
            return;
        }
        
        var payload = { jumlah: jumlah };
        
        var btn = document.getElementById('stokSubmitBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        }
        
        try {
            if (action === 'tambah') {
                await apiService.tambahStokObat(idBarang, payload);
            } else if (action === 'buang') {
                await apiService.buangObat(idBarang, payload);
            }
            
            showNotifikasiApoteker(config.onSuccess, 'success');
            document.getElementById('stokModal').remove();
            await loadStokObat();
            await loadRekomendasiObat();
        } catch (err) {
            showNotifikasiApoteker(err.message || 'Terjadi kesalahan', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> ' + config.submitText;
            }
        }
    }
}

// ==================== TAMBAH OBAT BARU ====================

function showTambahObatModal() {
    var overlay = document.createElement('div');
    overlay.id = 'tambahObatModal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;justify-content:center;align-items:center;';
    
    var box = document.createElement('div');
    box.style.cssText = 'background:white;border-radius:16px;padding:30px;max-width:450px;width:95%;';
    
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid var(--btn-primary);padding-bottom:10px;';
    header.innerHTML = '<h2 style="margin:0;color:var(--text-secondary);"><i class="fas fa-plus-circle"></i> Tambah Obat Baru</h2><span onclick="document.getElementById(\'tambahObatModal\').remove()" style="font-size:24px;cursor:pointer;color:var(--text-muted);padding:0 8px;"><i class="fas fa-times"></i></span>';
    box.appendChild(header);
    
    var fields = [
        { name: 'nama_obat', label: 'Nama Obat', type: 'text', placeholder: 'Masukkan nama obat' },
        { name: 'stok_awal', label: 'Stok Awal', type: 'number', value: 0 },
        { name: 'batas_notifikasi', label: 'Batas Notifikasi', type: 'number', value: 50 },
        { name: 'harga', label: 'Harga (Rp)', type: 'number', value: 0, placeholder: 'Masukkan harga per pcs' }
    ];
    
    fields.forEach(function(field) {
        var group = document.createElement('div');
        group.style.cssText = 'margin-bottom:14px;';
        
        var label = document.createElement('label');
        label.style.cssText = 'display:block;font-weight:600;font-size:0.85rem;color:var(--text-secondary);margin-bottom:5px;';
        label.textContent = field.label + (field.name === 'nama_obat' ? ' *' : '');
        group.appendChild(label);
        
        var input = document.createElement('input');
        input.type = field.type;
        input.id = 'obat_' + field.name;
        input.placeholder = field.placeholder || '';
        input.value = field.value || '';
        if (field.name === 'nama_obat') input.required = true;
        input.style.cssText = 'width:100%;padding:10px 14px;border:1px solid var(--border-color);border-radius:8px;font-size:0.9rem;';
        group.appendChild(input);
        
        box.appendChild(group);
    });
    
    var footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color);';
    footer.innerHTML = `
        <button id="obatSubmitBtn" style="flex:1;background:var(--btn-primary);color:white;padding:12px;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
            <i class="fas fa-save"></i> Simpan Obat
        </button>
        <button onclick="document.getElementById('tambahObatModal').remove();" style="padding:12px 24px;background:var(--bg-secondary);border:none;border-radius:8px;font-weight:500;cursor:pointer;color:var(--badge-secondary-text);">
            <i class="fas fa-times"></i> Batal
        </button>
    `;
    box.appendChild(footer);
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    document.getElementById('obatSubmitBtn').addEventListener('click', async function() {
        var nama = document.getElementById('obat_nama_obat').value.trim();
        var stok = parseInt(document.getElementById('obat_stok_awal').value) || 0;
        var batas = parseInt(document.getElementById('obat_batas_notifikasi').value) || 50;
        var harga = parseFloat(document.getElementById('obat_harga').value) || 0;
        
        if (!nama) {
            showNotifikasiApoteker('Nama obat wajib diisi!', 'error');
            return;
        }
        
        var btn = this;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        try {
            await apiService.tambahObatBaru({ 
                nama_obat: nama, 
                stok_awal: stok, 
                batas_notifikasi: batas,
                harga: harga
            });
            showNotifikasiApoteker('Obat berhasil ditambahkan!', 'success');
            document.getElementById('tambahObatModal').remove();
            await loadStokObat();
        } catch (err) {
            showNotifikasiApoteker(err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Simpan Obat';
        }
    });
}

// ==================== EXPORT ====================

window.loadStokObat = loadStokObat;
window.loadRekomendasiObat = loadRekomendasiObat;
window.showStokModal = showStokModal;
window.showTambahObatModal = showTambahObatModal;
window.showProsesObatModal = showProsesObatModal;

console.log('[APOTEKER] Dashboard Apoteker Controller loaded - Version 2.2');