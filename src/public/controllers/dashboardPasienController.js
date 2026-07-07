/**
 * Pasien Dashboard Controller
 * Version: 3.4 - Status profil mengikuti dropdown
 */

document.addEventListener('DOMContentLoaded', () => {
    const namaUserSpan = document.getElementById('namaUser');
    if (namaUserSpan) {
        const username = getUsername();
        if (username) namaUserSpan.innerText = username;
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            utils.logout();
        };
    }
    
    const form = document.getElementById('searchForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await searchPasien();
        });
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const nama = urlParams.get('nama');
    
    if (id) {
        document.getElementById('searchId').value = id;
        searchPasien();
    } else if (nama) {
        document.getElementById('searchNama').value = nama;
        searchPasien();
    }
});

// ==================== SEARCH PASIEN ====================

async function searchPasien() {
    const id = document.getElementById('searchId').value.trim();
    const nama = document.getElementById('searchNama').value.trim();
    const errorDiv = document.getElementById('searchError');
    const resultContainer = document.getElementById('resultContainer');
    
    if (!id && !nama) {
        errorDiv.innerText = 'Masukkan ID Pasien atau Nama Pasien';
        resultContainer.innerHTML = '';
        return;
    }
    
    if (id && (isNaN(id) || parseInt(id) <= 0)) {
        errorDiv.innerText = 'ID Pasien harus berupa angka positif';
        return;
    }
    
    if (nama && nama.length < 2) {
        errorDiv.innerText = 'Nama minimal 2 karakter';
        return;
    }
    
    errorDiv.innerText = '';
    resultContainer.innerHTML = `
        <div class="loading-spinner" style="text-align:center; padding:40px; color:#2c7da0;">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p style="margin-top:12px;">Mencari data pasien...</p>
        </div>
    `;
    
    try {
        const data = await apiService.searchPasien(id || null, nama || null);
        
        if (!data.pasien) {
            resultContainer.innerHTML = `
                <div class="not-found" style="text-align:center; padding:30px; background:#fee2e2; border-radius:12px; color:#b91c1c;">
                    <i class="fas fa-search fa-2x"></i>
                    <p style="margin-top:12px;">Pasien tidak ditemukan.</p>
                </div>
            `;
            return;
        }
        
        // ✅ Sinkronisasi: ambil status dari dropdown (allPasienList) jika ada
        if (typeof allPasienList !== 'undefined' && allPasienList.length > 0) {
            const match = allPasienList.find(p => p.id_pasien == data.pasien.id_pasien);
            if (match && match.msh_dirawat) {
                data.pasien.msh_dirawat = match.msh_dirawat; // timpa dengan status dari dropdown
            }
        }
        
        renderHasil(data);
        
        // Set dropdown ke pasien yang dicari (jika belum)
        if (typeof pasienDropdown !== 'undefined') {
            pasienDropdown.value = data.pasien.id_pasien;
        }
        
    } catch (err) {
        console.error('Search error:', err);
        resultContainer.innerHTML = `
            <div class="error-message" style="text-align:center; padding:30px; background:#fee2e2; border-radius:12px; color:#b91c1c;">
                <i class="fas fa-exclamation-circle fa-2x"></i>
                <p style="margin-top:12px;">Gagal mencari: ${err.message}</p>
            </div>
        `;
    }
}

// ==================== RENDER HASIL ====================

function renderHasil(data) {
    const pasien = data.pasien;
    const dokter = data.dokter;
    const riwayat = data.riwayat || [];
    const tagihan = data.tagihan;
    
    // Status pasien
    let statusText = '', statusClass = '';
    const status = pasien.msh_dirawat ? pasien.msh_dirawat.toLowerCase() : '';
    
    if (status === 'baru') {
        statusText = 'Baru';
        statusClass = 'badge badge-info';
    } else if (status === 'dirawat') {
        statusText = 'Dirawat';
        statusClass = 'badge badge-warning';
    } else if (status === 'pulang') {
        statusText = 'Pulang';
        statusClass = 'badge badge-success';
    } else {
        statusText = 'Tidak diketahui';
        statusClass = 'badge badge-secondary';
    }
    
    let html = '';
    
    // Profil Pasien
    html += `
        <div class="card">
            <h2><i class="fas fa-user-circle"></i> Profil Pasien</h2>
            <div class="profil-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px,1fr)); gap:12px;">
                <div><strong>ID Pasien:</strong> ${pasien.id_pasien}</div>
                <div><strong>Nama:</strong> ${escapeHtml(pasien.nama)}</div>
                <div><strong>Nama Wali:</strong> ${escapeHtml(pasien.nama_wali || '-')}</div>
                <div><strong>Jenis Penyakit:</strong> ${escapeHtml(pasien.jenis_penyakit || '-')}</div>
                <div><strong>Nama Penyakit:</strong> ${escapeHtml(pasien.nama_penyakit || '-')}</div>
                <div><strong>Umur:</strong> ${pasien.umur || '-'}</div>
                <div><strong>Jenis Kelamin:</strong> ${pasien.jenis_kelamin === 'L' ? 'Laki-laki' : (pasien.jenis_kelamin === 'P' ? 'Perempuan' : '-')}</div>
                <div><strong>No. Telp Pasien:</strong> ${escapeHtml(pasien.no_telp_pasien || '-')}</div>
                <div><strong>No. Telp Wali:</strong> ${escapeHtml(pasien.no_telp_wali || '-')}</div>
                <div><strong>Deskripsi Dokter:</strong> ${escapeHtml(pasien.deskripsi_dokter || '-')}</div>
                <div><strong>Status:</strong> <span class="${statusClass}">${statusText}</span></div>
            </div>
        </div>
    `;
    
    // Dokter
    html += `
        <div class="card">
            <h2><i class="fas fa-user-md"></i> Dokter Penanggung Jawab</h2>
            ${dokter ? `
                <div><strong>Nama Dokter:</strong> ${escapeHtml(dokter.nama_dokter)}</div>
                <div><strong>Spesialisasi:</strong> ${escapeHtml(dokter.spesialisasi || '-')}</div>
            ` : '<p>Tidak ada data dokter.</p>'}
        </div>
    `;
    
    // Tagihan Terakhir
    if (tagihan) {
        // ✅ Hitung total dari rincian
        const totalCheckup = parseFloat(tagihan.total_checkup || 0);
        const totalObat = parseFloat(tagihan.total_obat || 0);
        const totalRawatInap = parseFloat(tagihan.total_rawat_inap || 0);
        const totalRincian = totalCheckup + totalObat + totalRawatInap;
        const totalBiaya = parseFloat(tagihan.total_biaya || totalRincian);
        
        html += `
            <div class="card">
                <h2><i class="fas fa-receipt"></i> Tagihan Terakhir</h2>
                <div><strong>ID Tagihan:</strong> ${tagihan.id_tagihan}</div>
                <div><strong>Total Biaya:</strong> ${formatCurrency(totalBiaya)}</div>
                <div><strong>Rincian:</strong></div>
                <div style="margin-left:20px;font-size:0.9rem;color:#475569;">
                    <div>🩺 Checkup: ${formatCurrency(totalCheckup)}</div>
                    <div>💊 Obat: ${formatCurrency(totalObat)}</div>
                    <div>🛏️ Rawat Inap: ${formatCurrency(totalRawatInap)}</div>
                </div>
                <div><strong>Status:</strong> ${tagihan.status === 'lunas' ? '<span class="badge badge-success">Lunas</span>' : '<span class="badge badge-danger">Belum Lunas</span>'}</div>
                <div><strong>Tanggal:</strong> ${formatDate(tagihan.tanggal_tagihan)}</div>
                <div><strong>Keterangan:</strong> ${escapeHtml(tagihan.keterangan || '-')}</div>
            </div>
        `;
    } else {
        html += `
            <div class="card">
                <h2><i class="fas fa-receipt"></i> Tagihan Terakhir</h2>
                <p>Belum ada tagihan.</p>
            </div>
        `;
    }
    
    // Riwayat Checkup
    html += `
        <div class="card">
            <h2><i class="fas fa-history"></i> Riwayat Checkup</h2>
            ${riwayat.length === 0 ? '<p>Belum ada riwayat checkup.</p>' : `
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Dokter</th>
                                <th>Biaya</th>
                                <th>Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${riwayat.map(r => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${r.checkin_formatted || '-'}</td>
                                    <td>${r.checkout_formatted || '-'}</td>
                                    <td>${escapeHtml(r.nama_dokter || '-')}</td>
                                    <td>${formatCurrency(r.biaya_checkup || 0)}</td>
                                    <td>${escapeHtml(truncateText(r.keterangan || '-', 30))}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
    
    document.getElementById('resultContainer').innerHTML = html;
}

// ==================== EXPORT ====================

window.searchPasien = searchPasien;
window.renderHasil = renderHasil;