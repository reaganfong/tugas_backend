/**
 * API Service - Centralized API communication
 * Version: 2.2 - FIXED REGISTER
 */

class APIService {
    constructor(config) {
        config = config || {};
        this.baseURL = config.baseURL || this.getBaseURL();
        this.timeout = config.timeout || 30000;
        this.retryCount = config.retryCount || 2;
        this.retryDelay = config.retryDelay || 1000;
    }

    getBaseURL() {
        var port = window.location.port || '3000';
        return 'http://localhost:' + port + '/api';
    }

    async request(endpoint, options) {
        options = options || {};
        console.log('[API] ' + (options.method || 'GET') + ' ' + endpoint);
        
        var url = this.baseURL + endpoint;
        console.log('[API] Request URL:', url);
        
        var controller = new AbortController();
        var timeoutId = setTimeout(function() {
            controller.abort();
        }, this.timeout);

        try {
            var defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                signal: controller.signal
            };

            var savedCookie = localStorage.getItem('rumahsehat_cookie');
            if (savedCookie) {
                defaultOptions.headers['Cookie'] = savedCookie;
                console.log('[API] Mengirim cookie saved:', savedCookie.substring(0, 50) + '...');
            }

            for (var key in options) {
                if (options.hasOwnProperty(key)) {
                    defaultOptions[key] = options[key];
                }
            }

            if (defaultOptions.body && typeof defaultOptions.body === 'object') {
                defaultOptions.body = JSON.stringify(defaultOptions.body);
            }

            var response = await fetch(url, defaultOptions);
            clearTimeout(timeoutId);

            console.log('[API] Response status: ' + response.status);

            var setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                var cookieMatch = setCookie.match(/rumahsehat\.sid=([^;]+)/);
                if (cookieMatch) {
                    localStorage.setItem('rumahsehat_cookie', setCookie);
                    console.log('[API] Cookie disimpan:', setCookie.substring(0, 50) + '...');
                }
            }

            var data = null;
            var contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
                console.log('[API] Response text:', data);
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
        
        setTimeout(function() {
            var cookie = document.cookie;
            if (cookie) {
                localStorage.setItem('rumahsehat_cookie', cookie);
                console.log('[API] Cookie login disimpan:', cookie.substring(0, 50) + '...');
            }
        }, 100);
        
        return result;
    }

    async logout() {
        localStorage.removeItem('rumahsehat_cookie');
        return this.post('/auth/logout');
    }

    // ===== FIXED REGISTER =====
    async register(username, password, jabatan, dokterData) {
        dokterData = dokterData || null;
        console.log('[API] Register request:', { 
            username, 
            jabatan, 
            dokterData: dokterData ? 'ADA' : 'TIDAK ADA' 
        });
        
        const payload = { 
            username, 
            password, 
            jabatan, 
            dokterData 
        };
        
        console.log('[API] Payload yang dikirim:', JSON.stringify(payload, null, 2));
        
        return this.post('/auth/register', payload);
    }

    // ==================== ADMIN ENDPOINTS ====================
    async getUsers() {
        return this.get('/admin/users');
    }

    async getPasien() {
        return this.get('/admin/pasien');
    }

    async getPasienFiltered(search = '', status = '', page = 1, limit = 10) {
        const params = new URLSearchParams({
            search: search,
            status: status,
            page: page,
            limit: limit
        });
        return this.get('/admin/pasien/filter?' + params.toString());
    }

    async addPasien(data) {
        console.log('[API] addPasien data:', data);
        return this.post('/admin/pasien', data);
    }

    async updatePasien(id, data) {
        return this.put('/admin/pasien/' + id, data);
    }

    async getBayi() {
        return this.get('/admin/bayi');
    }

    async getBayiFiltered(search = '', page = 1, limit = 10) {
        const params = new URLSearchParams({
            search: search,
            page: page,
            limit: limit
        });
        return this.get('/admin/bayi/filter?' + params.toString());
    }

    async addBayi(data) {
        console.log('[DEBUG] apiService.addBayi:', data);
        return this.post('/admin/bayi', data);
    }

    async updateBayi(id, data) {
        return this.put('/admin/bayi/' + id, data);
    }

    async getDokter() {
        return this.get('/admin/dokter');
    }

    async getDokterFiltered(search = '', page = 1, limit = 10) {
        const params = new URLSearchParams({
            search: search,
            page: page,
            limit: limit
        });
        return this.get('/admin/dokter/filter?' + params.toString());
    }

    async updateDokter(id, data) {
        return this.put('/admin/dokter/' + id, data);
    }

    async getStaff() {
        return this.get('/admin/staff');
    }

    async getStaffFiltered(search = '', page = 1, limit = 10) {
        const params = new URLSearchParams({
            search: search,
            page: page,
            limit: limit
        });
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
        const params = new URLSearchParams({
            search: search,
            searchType: searchType,
            status: status,
            page: page,
            limit: limit
        });
        return this.get('/admin/checkup/filter?' + params.toString());
    }

    async addCheckup(data) {
        return this.post('/admin/checkup', data);
    }

    async updateCheckup(id, data) {
        return this.put('/admin/checkup/' + id, data);
    }

    async getRuanganStatus(nama) {
        nama = nama || null;
        var endpoint = nama ? '/admin/ruangan/' + encodeURIComponent(nama) : '/admin/ruangan';
        return this.get(endpoint);
    }

    async getRuanganFiltered(search = '', status = '', page = 1, limit = 10) {
        const params = new URLSearchParams({
            search: search,
            status: status,
            page: page,
            limit: limit
        });
        return this.get('/admin/ruangan/filter?' + params.toString());
    }

    async updateRuangan(id, data) {
        return this.put('/admin/ruangan/' + id, data);
    }

    async updateRuanganStatus(id, data) {
        console.log('[API] updateRuanganStatus called:', id, data);
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
        console.log('[API] updateCheckupStatus:', { id, diagnosis, rekomendasi_obat });
        return this.put('/dokter/checkup/' + id + '/selesai', { 
            diagnosis: diagnosis, 
            rekomendasi_obat: rekomendasi_obat 
        });
    }

    async dischargePasien(id) {
        console.log('[API] dischargePasien called for ID:', id);
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
        console.log('[API] tambahStokObat:', { id, payload });
        return this.put('/apoteker/obat/' + id + '/tambah', payload);
    }

    async kurangiStokObat(id, jumlah, id_checkup) {
        console.log('[API] kurangiStokObat:', { id, jumlah, id_checkup });
        
        var payload = {
            jumlah: parseInt(jumlah),
            id_checkup: parseInt(id_checkup)
        };
        
        console.log('[API] Payload dikirim:', JSON.stringify(payload));
        
        return this.put('/apoteker/obat/' + id + '/kurang', payload);
    }

    async buangObat(id, payload) {
        console.log('[API] buangObat:', { id, payload });
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
        id = id || null;
        nama = nama || null;
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

console.log('[API] apiService initialized with baseURL:', apiService.baseURL);
console.log('[API] Version 2.2 - FIXED REGISTER');