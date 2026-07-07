/**
 * API Service — Centralized API communication
 * Version: 3.0 — JWT + Bearer token
 */

class APIService {
    constructor(config) {
        config = config || {};
        this.baseURL = config.baseURL || this.getBaseURL();
        this.timeout = config.timeout || 30000;
    }

    getBaseURL() {
        return window.location.origin + '/api';
    }

    async request(endpoint, options) {
        options = options || {};
        console.log('[API] ' + (options.method || 'GET') + ' ' + endpoint);

        var url = this.baseURL + endpoint;
        var controller = new AbortController();
        var timeoutId = setTimeout(function() {
            controller.abort();
        }, this.timeout);

        try {
            var headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            // === ATTACH JWT TOKEN ===
            var token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }

            var fetchOptions = {
                headers: headers,
                signal: controller.signal
            };

            // Merge extra options
            for (var key in options) {
                if (options.hasOwnProperty(key)) {
                    fetchOptions[key] = options[key];
                }
            }

            if (fetchOptions.body && typeof fetchOptions.body === 'object') {
                fetchOptions.body = JSON.stringify(fetchOptions.body);
            }

            var response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            console.log('[API] Response status: ' + response.status);

            var data = null;
            var contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
                console.log('[API] Response text:', data);
            }

            // === HANDLE 401 — TOKEN EXPIRED ===
            if (response.status === 401) {
                console.warn('[API] Token expired atau invalid, redirect ke login');

                // Guard: jangan redirect kalau sedang di halaman login
                if (window.location.pathname === '/login') {
                    console.warn('[API] Sudah di /login, skip redirect loop');
                    var err401 = new Error('Sesi tidak valid. Silakan login ulang.');
                    err401.status = 401;
                    throw err401;
                }

                // Guard: cegah multiple redirect dari request paralel
                if (window._redirectingToLogin) {
                    console.warn('[API] Redirect sedang berlangsung, skip 401 handler');
                    return;
                }
                window._redirectingToLogin = true;

                localStorage.removeItem('token');
                localStorage.removeItem('jabatan');
                localStorage.removeItem('username');
                localStorage.removeItem('nama');
                localStorage.removeItem('user_id');

                // Panggil logout API dulu untuk clear cookie di server
                fetch(this.baseURL + '/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }).catch(function() {
                    // Ignore — best effort clear cookie
                }).finally(function() {
                    // Redirect dengan flag expired agar server tidak redirect balik
                    window.location.href = '/login?expired=1';
                });
                return;
            }

            if (!response.ok) {
                var error = new Error(
                    typeof data === 'object' && data.message
                        ? data.message
                        : 'HTTP ' + response.status + ': ' + response.statusText
                );
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                var timeoutError = new Error('Request timeout - server tidak merespons');
                timeoutError.status = 408;
                throw timeoutError;
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                var networkError = new Error('Gagal terhubung ke server. Periksa koneksi internet.');
                networkError.status = 0;
                throw networkError;
            }

            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ==================== AUTH ENDPOINTS ====================

    async login(username, password, jabatan) {
        console.log('[API] Login request:', { username, jabatan });
        var result = await this.post('/auth/login', { username, password, jabatan });

        // Simpan token ke localStorage
        if (result && result.token) {
            localStorage.setItem('token', result.token);
            console.log('[API] Token saved to localStorage');
        }

        return result;
    }

    async logout() {
        localStorage.removeItem('token');
        return this.post('/auth/logout');
    }

    // ===== REGISTER =====
    async register(username, password, jabatan, dokterData) {
        dokterData = dokterData || null;
        console.log('[API] Register request:', {
            username,
            jabatan,
            dokterData: dokterData ? 'ADA' : 'TIDAK ADA'
        });

        const payload = { username, password, jabatan, dokterData };
        return this.post('/auth/register', payload);
    }

    // ===== CHECK AUTH / ME =====
    async getMe() {
        return this.get('/auth/me');
    }

    // ==================== ADMIN ENDPOINTS ====================
    async getUsers() {
        return this.get('/admin/users');
    }

    async getPasien() {
        return this.get('/admin/pasien');
    }

    async getPasienFiltered(search = '', status = '', page = 1, limit = 10) {
        const params = new URLSearchParams({ search, status, page, limit });
        return this.get('/admin/pasien/filter?' + params.toString());
    }

    async addPasien(data) {
        return this.post('/admin/pasien', data);
    }

    async updatePasien(id, data) {
        return this.put('/admin/pasien/' + id, data);
    }

    async getBayi() {
        return this.get('/admin/bayi');
    }

    async getBayiFiltered(search = '', page = 1, limit = 10) {
        const params = new URLSearchParams({ search, page, limit });
        return this.get('/admin/bayi/filter?' + params.toString());
    }

    async addBayi(data) {
        return this.post('/admin/bayi', data);
    }

    async updateBayi(id, data) {
        return this.put('/admin/bayi/' + id, data);
    }

    async getDokter() {
        return this.get('/admin/dokter');
    }

    async getDokterFiltered(search = '', page = 1, limit = 10) {
        const params = new URLSearchParams({ search, page, limit });
        return this.get('/admin/dokter/filter?' + params.toString());
    }

    async updateDokter(id, data) {
        return this.put('/admin/dokter/' + id, data);
    }

    async getStaff() {
        return this.get('/admin/staff');
    }

    async getStaffFiltered(search = '', page = 1, limit = 10) {
        const params = new URLSearchParams({ search, page, limit });
        return this.get('/admin/staff/filter?' + params.toString());
    }

    async addStaff(data) {
        return this.post('/admin/staff', data);
    }

    async updateStaff(id, data) {
        return this.put('/admin/staff/' + id, data);
    }

    async getCheckup() {
        return this.get('/admin/checkup');
    }

    async getCheckupFiltered(search = '', searchType = 'all', status = '', page = 1, limit = 10) {
        const params = new URLSearchParams({ search, searchType, status, page, limit });
        return this.get('/admin/checkup/filter?' + params.toString());
    }

    async addCheckup(data) {
        return this.post('/admin/checkup', data);
    }

    async updateCheckup(id, data) {
        return this.put('/admin/checkup/' + id, data);
    }

    async getRuanganStatus(nama) {
        var endpoint = nama ? '/admin/ruangan/' + encodeURIComponent(nama) : '/admin/ruangan';
        return this.get(endpoint);
    }

    async getRuanganFiltered(search = '', status = '', page = 1, limit = 10) {
        const params = new URLSearchParams({ search, status, page, limit });
        return this.get('/admin/ruangan/filter?' + params.toString());
    }

    async updateRuangan(id, data) {
        return this.put('/admin/ruangan/' + id, data);
    }

    async updateRuanganStatus(id, data) {
        return this.put('/admin/ruangan/' + id + '/status', data);
    }

    async getNotifikasiDarurat() {
        return this.get('/admin/notifikasi');
    }

    async markNotifikasiRead(id) {
        return this.put('/admin/notifikasi/' + id + '/read');
    }

    async getPasienCheckInOutAdmin() {
        return this.get('/admin/pasien/checkinout');
    }

    async getShiftJadwal(filters) {
        filters = filters || {};
        var params = new URLSearchParams(filters);
        var query = params.toString() ? '?' + params : '';
        return this.get('/admin/shift' + query);
    }

    async getJadwalCheckup() {
        return this.get('/admin/checkup/jadwal');
    }

    async getSudahCheckout() {
        return this.get('/admin/checkup/sudah-checkout');
    }

    async addShift(data) {
        return this.post('/admin/shift', data);
    }

    // ==================== DOKTER ENDPOINTS ====================

    async getDashboardDokter() {
        return this.get('/dokter/dashboard');
    }

    async getPasienSaya(search) {
        search = search || '';
        var query = search ? '?search=' + encodeURIComponent(search) : '';
        return this.get('/dokter/pasien-saya' + query);
    }

    async getJadwalSaya() {
        return this.get('/dokter/jadwal');
    }

    async updateDeskripsiPasien(id, deskripsi) {
        return this.put('/dokter/pasien/' + id + '/deskripsi', { deskripsi: deskripsi });
    }

    async updateCheckupStatus(id, diagnosis, rekomendasi_obat = null) {
        return this.put('/dokter/checkup/' + id + '/selesai', {
            diagnosis: diagnosis,
            rekomendasi_obat: rekomendasi_obat
        });
    }

    async dischargePasien(id) {
        return this.put('/dokter/pasien/' + id + '/discharge');
    }

    async batalkanPulangPasien(id) {
        return this.put('/dokter/pasien/' + id + '/batalkan-pulang');
    }

    async dischargePasienWithNote(id, catatan_obat) {
        return this.put('/dokter/pasien/' + id + '/discharge', { catatan_obat: catatan_obat });
    }

    // ==================== AKUNTAN ENDPOINTS ====================

    async getTagihan(filters) {
        filters = filters || {};
        var params = new URLSearchParams(filters);
        var query = params.toString() ? '?' + params : '';
        return this.get('/akuntan/tagihan' + query);
    }

    async getTagihanByStatus(status) {
        return this.getTagihan({ status: status });
    }

    async getDetailTagihan(id) {
        return this.get('/akuntan/tagihan/' + id + '/detail');
    }

    async addTagihan(data) {
        return this.post('/akuntan/tagihan', data);
    }

    async updateTagihanStatus(id, status) {
        return this.put('/akuntan/tagihan/' + id + '/status', { status: status });
    }

    async batalkanLunasTagihan(id) {
        return this.put('/akuntan/tagihan/' + id + '/batalkan-lunas');
    }

    async getFasilitas() {
        return this.get('/akuntan/fasilitas');
    }

    async toggleFasilitasStatus(id) {
        return this.put('/akuntan/fasilitas/' + id + '/toggle');
    }

    async getPasienCheckInOut() {
        return this.get('/akuntan/pasien/checkinout');
    }

    // ==================== APOTEKER ENDPOINTS ====================

    async getObat() {
        return this.get('/apoteker/obat');
    }

    async getCheckupForApoteker(search) {
        const query = search ? '?search=' + encodeURIComponent(search) : '';
        return this.get('/apoteker/checkup' + query);
    }

    async batalCheckup(id) {
        return this.put('/admin/checkup/' + id + '/batal');
    }

    async tambahStokObat(id, payload) {
        return this.put('/apoteker/obat/' + id + '/tambah', payload);
    }

    async kurangiStokObat(id, jumlah, id_checkup) {
        var payload = { jumlah: parseInt(jumlah), id_checkup: parseInt(id_checkup) };
        return this.put('/apoteker/obat/' + id + '/kurang', payload);
    }

    async buangObat(id, payload) {
        return this.put('/apoteker/obat/' + id + '/buang', payload);
    }

    async tambahObatBaru(data) {
        return this.post('/apoteker/obat', data);
    }

    async getCheckupRekomendasi() {
        return this.get('/apoteker/checkup/rekomendasi');
    }

    // ==================== PASIEN ENDPOINTS ====================

    async searchPasien(id, nama) {
        var query = '';
        if (id) {
            query = '?id=' + encodeURIComponent(id);
        } else if (nama) {
            query = '?nama=' + encodeURIComponent(nama);
        }
        return this.get('/pasien/search' + query);
    }

    async getProfilPasien(id) {
        return this.get('/pasien/' + id);
    }
}

// ===== INITIALIZE =====
var apiService = new APIService();
window.apiService = apiService;

console.log('[API] apiService v3.0 initialized — JWT mode');
