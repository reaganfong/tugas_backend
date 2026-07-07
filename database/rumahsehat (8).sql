-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 04 Jul 2026 pada 08.25
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rumahsehat`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `admin`
--

CREATE TABLE `admin` (
  `id_admin` int(11) NOT NULL,
  `nama_admin` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `admin`
--

INSERT INTO `admin` (`id_admin`, `nama_admin`) VALUES
(1, 'Admin Utama'),
(2, 'Admin Kedua');

-- --------------------------------------------------------

--
-- Struktur dari tabel `bayi`
--

CREATE TABLE `bayi` (
  `id_bayi` int(11) NOT NULL,
  `id_ibu` int(11) NOT NULL,
  `nama_ibu` varchar(100) NOT NULL,
  `nama_bayi` varchar(50) DEFAULT 'Belum bernama',
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `berat` decimal(5,2) DEFAULT NULL,
  `tinggi` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `bayi`
--

INSERT INTO `bayi` (`id_bayi`, `id_ibu`, `nama_ibu`, `nama_bayi`, `jenis_kelamin`, `berat`, `tinggi`) VALUES
(1, 1, 'Ibu Ani', 'Bayi A', 'P', 3.10, 49.00),
(2, 2, 'Ibu Siti', 'Bayi B', 'L', 3.50, 50.00),
(3, 3, 'Ibu Rina', 'Bayi C', 'L', 3.00, 48.00),
(4, 4, 'Ibu Dewi', 'Bayi D', 'P', 3.30, 49.00),
(5, 5, 'Diana', 'Chika', 'L', 5.00, 47.00),
(7, 6, 'Vera', 'Quena', 'P', 3.40, 49.50),
(8, 7, 'quena', 'calvin', 'L', 5.00, 49.80),
(9, 8, 'quena', 'erphan', 'L', 5.10, 49.80);

-- --------------------------------------------------------

--
-- Struktur dari tabel `check_up`
--

CREATE TABLE `check_up` (
  `id_checkup` int(11) NOT NULL,
  `id_pasien` int(11) DEFAULT NULL,
  `id_dokter` int(11) DEFAULT NULL,
  `tanggal` date NOT NULL,
  `jam` time NOT NULL,
  `checkout` datetime DEFAULT NULL,
  `status` enum('terjadwal','selesai','batal') DEFAULT 'terjadwal',
  `keterangan` text DEFAULT NULL,
  `rekomendasi_obat` text DEFAULT NULL,
  `biaya_checkup` decimal(10,2) DEFAULT 0.00,
  `id_tagihan` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `check_up`
--

INSERT INTO `check_up` (`id_checkup`, `id_pasien`, `id_dokter`, `tanggal`, `jam`, `checkout`, `status`, `keterangan`, `rekomendasi_obat`, `biaya_checkup`, `id_tagihan`) VALUES
(1, 1, 2, '2026-07-03', '12:10:00', '2026-07-03 12:15:42', 'selesai', '[Diagnosis]: febris', 'Paracetamol 2x', 150000.00, 1),
(2, 2, 2, '2026-07-03', '12:16:00', NULL, 'batal', NULL, NULL, 150000.00, NULL),
(3, 3, 2, '2026-07-03', '12:17:00', '2026-07-03 13:15:03', 'selesai', '[Diagnosis]: febris', 'Paracetamol 3x', 150000.00, 3),
(4, 16, 2, '2026-07-03', '14:37:00', '2026-07-03 14:39:24', 'selesai', '[Diagnosis]: flu', 'Amoxicillin', 150000.00, 2),
(5, 2, 2, '2026-07-04', '11:40:00', NULL, 'batal', NULL, NULL, 0.00, NULL),
(6, 2, 2, '2026-07-04', '11:40:00', '2026-07-04 11:43:04', 'selesai', 'flu', 'amixicillin 2x', 150000.00, NULL),
(7, 4, 2, '2026-07-04', '12:31:00', '2026-07-04 12:34:18', 'selesai', 'flu', 'amoxicillin 2x', 150000.00, NULL),
(8, 5, 2, '2026-07-04', '12:47:00', '2026-07-04 12:49:38', 'selesai', 'febris', 'Paracetamol 2x', 500000.00, 6),
(9, 15, 2, '2026-07-04', '12:52:00', '2026-07-04 12:53:41', 'selesai', 'flu', 'amoxicillin 1x', 150000.00, 7),
(10, 6, 2, '2026-07-04', '13:07:00', '2026-07-04 13:09:28', 'selesai', 'febris', 'paracetamol 2x', 150000.00, 8),
(11, 18, 2, '2026-07-04', '13:12:00', NULL, 'terjadwal', NULL, NULL, 0.00, NULL),
(12, 20, 2, '2026-07-04', '13:12:00', '2026-07-04 13:13:46', 'selesai', 'flu', 'amoxicillin 2x', 100000.00, 9);

-- --------------------------------------------------------

--
-- Struktur dari tabel `dokter`
--

CREATE TABLE `dokter` (
  `id_dokter` int(11) NOT NULL,
  `nama_dokter` varchar(100) DEFAULT NULL,
  `spesialisasi` varchar(100) DEFAULT NULL,
  `umur` int(11) DEFAULT NULL,
  `no_telepon` varchar(15) DEFAULT NULL,
  `biaya_honor` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `dokter`
--

INSERT INTO `dokter` (`id_dokter`, `nama_dokter`, `spesialisasi`, `umur`, `no_telepon`, `biaya_honor`) VALUES
(2, 'Dr. Budi', 'Umum', 30, '0811111111', 150000),
(5, 'Dr. Sinta', 'Anak', 35, '0822222222', 200000),
(7, 'Dr. Andi', 'Jantung', 40, '0833333333', 300000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `fasilitas`
--

CREATE TABLE `fasilitas` (
  `id_fasilitas` int(11) NOT NULL,
  `nama_fasilitas` varchar(100) DEFAULT NULL,
  `status` enum('baik','rusak') DEFAULT 'baik'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `fasilitas`
--

INSERT INTO `fasilitas` (`id_fasilitas`, `nama_fasilitas`, `status`) VALUES
(1, 'MRI', 'baik'),
(2, 'Rontgen', 'baik'),
(3, 'USG', 'baik');

-- --------------------------------------------------------

--
-- Struktur dari tabel `notifikasi`
--

CREATE TABLE `notifikasi` (
  `id_notif` int(11) NOT NULL,
  `jenis` varchar(50) DEFAULT NULL,
  `pesan` text DEFAULT NULL,
  `tanggal` datetime DEFAULT current_timestamp(),
  `dibaca` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `notifikasi`
--

INSERT INTO `notifikasi` (`id_notif`, `jenis`, `pesan`, `tanggal`, `dibaca`) VALUES
(1, 'darurat', 'Pasien butuh bantuan', '2026-06-30 19:14:46', 1),
(2, 'stok', 'Obat hampir habis', '2026-06-30 19:14:46', 1),
(3, 'darurat', 'ICU penuh', '2026-06-30 19:14:46', 1),
(4, 'info', 'Pasien baru masuk', '2026-06-30 19:14:46', 1),
(5, 'discharge', 'Pasien Siti telah dipulangkan (discharge) oleh dokter.', '2026-06-30 19:16:54', 1),
(6, 'fasilitas_rusak', 'Fasilitas MRI berstatus rusak. Perlu perbaikan.', '2026-06-30 19:18:41', 1),
(7, 'obat_dibuang', 'Obat Paracetamol sebanyak 2 telah dibuang.', '2026-06-30 20:56:27', 1),
(8, 'obat_dibuang', 'Obat Paracetamol sebanyak 89 telah dibuang.', '2026-06-30 21:35:21', 1),
(9, 'obat_dibuang', 'Obat Paracetamol sebanyak 10 telah dibuang.', '2026-06-30 22:04:51', 1),
(10, 'obat_dibuang', 'Obat Paracetamol sebanyak 10 telah dibuang.', '2026-06-30 22:04:59', 1),
(11, 'obat_dibuang', 'Obat Paracetamol sebanyak 10 telah dibuang.', '2026-06-30 23:03:26', 1),
(12, 'obat_dibuang', 'Obat Paracetamol sebanyak 10 telah dibuang.', '2026-06-30 23:13:07', 1),
(13, 'obat_dibuang', 'Obat test sebanyak 100 telah dibuang.', '2026-06-30 23:20:43', 1),
(14, 'fasilitas_rusak', 'Fasilitas MRI berstatus rusak. Perlu perbaikan.', '2026-06-30 23:30:42', 1),
(15, 'pasien_kembali', 'Pasien Siti kembali dirawat (dibatalkan pulang).', '2026-07-01 09:19:15', 1),
(17, 'pasien_pulang', 'Pasien Andi (ID: 1) telah dipulangkan. Tagihan otomatis dibuat. ID Tagihan: 1', '2026-07-03 12:15:42', 1),
(18, 'obat_dibeli', 'Pasien ID 3 membeli obat Paracetamol 3 pcs (Total: Rp30000). Tagihan otomatis diupdate.', '2026-07-03 13:42:28', 1),
(19, 'obat_dibeli', 'Pasien ID 1 membeli obat Paracetamol 2 pcs (Total: Rp20000). Tagihan otomatis diupdate.', '2026-07-03 13:48:50', 1),
(20, 'obat_dibuang', 'Obat Ibuprofen sebanyak 3 telah dibuang.', '2026-07-03 13:49:30', 1),
(21, 'fasilitas_rusak', 'Fasilitas Rontgen berstatus rusak. Perlu perbaikan.', '2026-07-03 13:50:00', 1),
(22, 'fasilitas_rusak', 'Fasilitas USG berstatus rusak. Perlu perbaikan.', '2026-07-03 13:50:05', 1),
(23, 'pasien_pulang', 'Pasien Andini (ID: 16) telah dipulangkan. Tagihan otomatis dibuat. ID Tagihan: 2', '2026-07-03 14:39:24', 1),
(24, 'obat_dibeli', 'Pasien ID 16 membeli obat Amoxicillin 1 pcs (Total: Rp15000). Tagihan otomatis diupdate.', '2026-07-03 14:39:50', 1),
(25, 'pasien_pulang', 'Pasien ID 3 telah dipulangkan dari ruangan Reguler. Tagihan otomatis diupdate.', '2026-07-03 14:59:10', 1),
(26, 'fasilitas_rusak', 'Fasilitas MRI berstatus rusak. Perlu perbaikan.', '2026-07-04 10:47:20', 1),
(27, 'pasien_pulang', 'Pasien Andini (ID: 16) telah dipulangkan. Tagihan otomatis dibuat. ID Tagihan: 2', '2026-07-04 11:43:43', 1),
(28, 'obat_dibuang', 'Obat Paracetamol sebanyak 10 telah dibuang.', '2026-07-04 11:51:31', 1),
(29, 'obat_dibuang', 'Obat Amoxicillin sebanyak 2 telah dibuang.', '2026-07-04 11:51:37', 1),
(30, 'obat_dibuang', 'Obat test sebanyak 10 telah dibuang.', '2026-07-04 11:51:55', 1),
(31, 'obat_dibeli', 'Pasien ID 2 membeli obat Amoxicillin 2 pcs (Total: Rp30000). Tagihan otomatis diupdate.', '2026-07-04 11:52:08', 1),
(32, 'fasilitas_rusak', 'Fasilitas MRI berstatus rusak. Perlu perbaikan.', '2026-07-04 11:53:34', 1),
(33, 'pasien_pulang', 'Pasien ID 2 telah dipulangkan dari ruangan Reguler.', '2026-07-04 11:53:54', 1),
(34, 'obat_dibeli', 'Pasien ID 4 membeli obat Amoxicillin 2 pcs (Total: Rp30000). Tagihan otomatis diupdate.', '2026-07-04 12:34:57', 1),
(35, 'obat_dibuang', 'Obat Amoxicillin sebanyak 10 telah dibuang.', '2026-07-04 12:35:12', 1),
(36, 'obat_dibuang', 'Obat test sebanyak 5 telah dibuang.', '2026-07-04 12:35:39', 1),
(37, 'pasien_pulang', 'Pasien ID 4 telah dipulangkan dari ruangan Reguler.', '2026-07-04 12:36:06', 1),
(38, 'pasien_pulang', 'Pasien Bayu (ID: 5) telah dipulangkan. Tagihan otomatis dibuat. ID Tagihan: 6', '2026-07-04 12:49:38', 1),
(39, 'obat_dibeli', 'Pasien ID 5 membeli obat Paracetamol 2 pcs (Total: Rp20000). Tagihan otomatis diupdate.', '2026-07-04 12:50:52', 1),
(40, 'obat_dibuang', 'Obat Paracetamol sebanyak 10 telah dibuang.', '2026-07-04 12:51:05', 1),
(41, 'pasien_pulang', 'Pasien ID 15 telah dipulangkan dari ruangan ICU (1 hari).', '2026-07-04 12:53:53', 1),
(42, 'obat_dibeli', 'Pasien ID 15 membeli obat Amoxicillin 1 pcs (Total: Rp15000). Tagihan otomatis diupdate.', '2026-07-04 12:54:13', 1),
(43, 'pasien_pulang', 'Pasien Tono (ID: 6) telah dipulangkan. Total tagihan: Rp150000', '2026-07-04 13:09:28', 0),
(44, 'obat_dibeli', 'Pasien ID 6 membeli obat Paracetamol 2 pcs (Total: Rp20000). Tagihan otomatis diupdate.', '2026-07-04 13:10:16', 0),
(45, 'obat_dibuang', 'Obat Paracetamol sebanyak 10 telah dibuang.', '2026-07-04 13:10:28', 0),
(46, 'obat_dibuang', 'Obat test sebanyak 5 telah dibuang.', '2026-07-04 13:10:50', 0),
(47, 'pasien_pulang', 'Pasien ID 20 telah dipulangkan dari ruangan Reguler. Total tagihan: Rp100000', '2026-07-04 13:14:01', 0),
(48, 'obat_dibeli', 'Pasien ID 20 membeli obat Amoxicillin 2 pcs (Total: Rp30000). Tagihan otomatis diupdate.', '2026-07-04 13:14:29', 0);

-- --------------------------------------------------------

--
-- Struktur dari tabel `pasien`
--

CREATE TABLE `pasien` (
  `id_pasien` int(11) NOT NULL,
  `nama` varchar(100) DEFAULT NULL,
  `nama_wali` varchar(100) DEFAULT NULL,
  `jenis_penyakit` enum('ringan','berat','kronis') DEFAULT NULL,
  `nama_penyakit` varchar(100) DEFAULT NULL,
  `umur` int(11) DEFAULT NULL,
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `no_telp_pasien` varchar(15) DEFAULT NULL,
  `no_telp_wali` varchar(15) DEFAULT NULL,
  `deskripsi_dokter` text DEFAULT NULL,
  `msh_dirawat` enum('baru','dirawat','pulang') DEFAULT 'baru'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `pasien`
--

INSERT INTO `pasien` (`id_pasien`, `nama`, `nama_wali`, `jenis_penyakit`, `nama_penyakit`, `umur`, `jenis_kelamin`, `no_telp_pasien`, `no_telp_wali`, `deskripsi_dokter`, `msh_dirawat`) VALUES
(1, 'Andi', 'Budi', NULL, 'febris', 25, 'L', '08112', '0822', 'febris', 'pulang'),
(2, 'Siti', 'Ahmad', NULL, NULL, 45, 'P', '0812', '0823', 'flu', 'pulang'),
(3, 'Rina', 'Joko', NULL, 'febris', 20, 'P', '0813', '0824', 'febris', 'pulang'),
(4, 'Dewi', 'Rudi', NULL, NULL, 50, 'P', '0814', '0825', 'flu', 'pulang'),
(5, 'Bayu', 'Anton', NULL, NULL, 30, 'L', '0815', '0826', 'febris', 'pulang'),
(6, 'Tono', 'Slamet', NULL, NULL, 28, 'L', '0816', '0827', 'febris', 'pulang'),
(7, 'Riko', 'Dedi', NULL, NULL, 22, 'L', '0817', '0828', NULL, 'baru'),
(8, 'Maya', 'Rina', NULL, NULL, 35, 'P', '0818', '0829', NULL, 'baru'),
(9, 'Joni', 'Tono', NULL, NULL, 19, 'L', '0819', '0830', NULL, 'baru'),
(10, 'Lina', 'Sari', NULL, NULL, 55, 'P', '0820', '0831', NULL, 'baru'),
(13, 'Ricky', 'Doni', NULL, NULL, 20, 'L', '085614782589', '081542635489', NULL, 'baru'),
(15, 'Setiawan', 'ani wijaya', NULL, NULL, 20, 'L', '081654963215', NULL, 'flu', 'pulang'),
(16, 'Andini', 'alan', 'ringan', 'flu', 20, 'P', '081265497854', '081254698725', 'flu', 'pulang'),
(17, 'andy', 'andika', 'ringan', NULL, 32, 'L', '0812543568745', NULL, NULL, 'baru'),
(18, 'mandila', 'anie', NULL, NULL, 45, 'P', '084567526522', NULL, NULL, 'baru'),
(19, 'budi', 'andi', NULL, NULL, 50, 'L', NULL, NULL, NULL, 'baru'),
(20, 'patrick', 'Doni', NULL, NULL, 15, 'L', NULL, NULL, 'flu', 'pulang');

-- --------------------------------------------------------

--
-- Struktur dari tabel `riwayat_obat`
--

CREATE TABLE `riwayat_obat` (
  `id_riwayat` int(11) NOT NULL,
  `id_checkup` int(11) DEFAULT NULL,
  `id_pasien` int(11) DEFAULT NULL,
  `id_obat` int(11) DEFAULT NULL,
  `jumlah` int(11) DEFAULT 1,
  `total_harga` decimal(10,2) DEFAULT NULL,
  `id_tagihan` int(11) DEFAULT NULL,
  `tanggal` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `riwayat_obat`
--

INSERT INTO `riwayat_obat` (`id_riwayat`, `id_checkup`, `id_pasien`, `id_obat`, `jumlah`, `total_harga`, `id_tagihan`, `tanggal`) VALUES
(1, 3, 3, 1, 3, 30000.00, 3, '2026-07-03 13:42:28'),
(2, 1, 1, 1, 2, 20000.00, 1, '2026-07-03 13:48:50'),
(3, 4, 16, 2, 1, 15000.00, 2, '2026-07-03 14:39:50'),
(4, 6, 2, 2, 2, 30000.00, NULL, '2026-07-04 11:52:08'),
(5, 7, 4, 2, 2, 30000.00, NULL, '2026-07-04 12:34:57'),
(6, 8, 5, 1, 2, 20000.00, 6, '2026-07-04 12:50:52'),
(7, 9, 15, 2, 1, 15000.00, 7, '2026-07-04 12:54:13'),
(8, 10, 6, 1, 2, 20000.00, 8, '2026-07-04 13:10:16'),
(9, 12, 20, 2, 2, 30000.00, 9, '2026-07-04 13:14:29');

-- --------------------------------------------------------

--
-- Struktur dari tabel `ruangan`
--

CREATE TABLE `ruangan` (
  `id_ruangan` int(11) NOT NULL,
  `nama_ruangan` varchar(50) DEFAULT NULL,
  `nomor_ruangan` int(11) DEFAULT NULL,
  `ditempati` int(11) DEFAULT NULL,
  `status` enum('kosong','terisi') DEFAULT 'kosong',
  `biaya_per_hari` decimal(10,2) DEFAULT 0.00,
  `id_tagihan` int(11) DEFAULT NULL,
  `tanggal_checkin` datetime DEFAULT NULL,
  `lama_inap` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `ruangan`
--

INSERT INTO `ruangan` (`id_ruangan`, `nama_ruangan`, `nomor_ruangan`, `ditempati`, `status`, `biaya_per_hari`, `id_tagihan`, `tanggal_checkin`, `lama_inap`) VALUES
(1, 'ICU', 301, NULL, 'kosong', 500000.00, 7, NULL, 1),
(2, 'Reguler', 102, NULL, 'kosong', 100000.00, 9, NULL, NULL),
(3, 'VIP', 201, NULL, 'kosong', 200000.00, NULL, NULL, NULL),
(4, 'Reguler', 104, NULL, 'kosong', 100000.00, 3, '2026-07-03 12:17:00', 2),
(5, 'VIP', 203, NULL, 'kosong', 200000.00, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `shift_staff`
--

CREATE TABLE `shift_staff` (
  `id_shift` int(11) NOT NULL,
  `id_staff` int(11) DEFAULT NULL,
  `hari` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') DEFAULT NULL,
  `shift` enum('Shift I','Shift II','Shift III') DEFAULT 'Shift III'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `shift_staff`
--

INSERT INTO `shift_staff` (`id_shift`, `id_staff`, `hari`, `shift`) VALUES
(5, 4, 'Selasa', 'Shift III'),
(6, 4, 'Jumat', 'Shift III'),
(10, 3, 'Selasa', 'Shift III'),
(11, 3, 'Rabu', 'Shift III'),
(12, 3, 'Kamis', 'Shift III'),
(15, 7, 'Rabu', 'Shift I'),
(16, 6, 'Jumat', 'Shift III'),
(17, 6, 'Minggu', 'Shift III'),
(18, 2, 'Senin', 'Shift I');

-- --------------------------------------------------------

--
-- Struktur dari tabel `shift_users`
--

CREATE TABLE `shift_users` (
  `id_shift` int(11) NOT NULL,
  `id_users` int(11) DEFAULT NULL,
  `hari` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') DEFAULT NULL,
  `shift` enum('Shift I','Shift II','Shift III') DEFAULT 'Shift III'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `shift_users`
--

INSERT INTO `shift_users` (`id_shift`, `id_users`, `hari`, `shift`) VALUES
(2, 6, 'Sabtu', 'Shift I'),
(5, 1, 'Rabu', 'Shift II'),
(6, 4, 'Senin', 'Shift II'),
(7, 4, 'Kamis', 'Shift II'),
(8, 4, 'Sabtu', 'Shift II'),
(9, 3, 'Senin', 'Shift I'),
(10, 3, 'Rabu', 'Shift I'),
(11, 3, 'Jumat', 'Shift I'),
(12, 5, 'Kamis', 'Shift II'),
(13, 5, 'Sabtu', 'Shift II');

-- --------------------------------------------------------

--
-- Struktur dari tabel `staff`
--

CREATE TABLE `staff` (
  `id_staff` int(11) NOT NULL,
  `jabatan` varchar(50) DEFAULT NULL,
  `nama_staff` varchar(50) DEFAULT NULL,
  `no_telepon` varchar(15) DEFAULT NULL,
  `gaji` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `staff`
--

INSERT INTO `staff` (`id_staff`, `jabatan`, `nama_staff`, `no_telepon`, `gaji`) VALUES
(1, 'Perawat', 'Ani', '08111', 500000),
(2, 'Perawat', 'Budi', '08112', 600000),
(3, 'Cleaning', 'Cici', '08113', 300000),
(4, 'Perawat', 'Dina', '08114', 550000),
(5, 'Cleaning', 'Eka', '08115', 300000),
(6, 'Admin', 'Fajar', '08116', 700000),
(7, 'Perawat', 'Kelvin', '081456285947', 500000),
(8, 'perawat', 'andica', '086452315689', 200000),
(9, 'perawat', 'marley', '082456142158', 500000),
(10, 'perawat', 'maria', NULL, 500000),
(11, 'Perawat', 'maria', NULL, 300000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `stok_obat`
--

CREATE TABLE `stok_obat` (
  `id_obat` int(11) NOT NULL,
  `nama_obat` varchar(100) DEFAULT NULL,
  `stok` int(11) DEFAULT NULL,
  `batas_notifikasi` int(11) DEFAULT 50,
  `tanggal_restok_terakhir` date DEFAULT NULL,
  `harga` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `stok_obat`
--

INSERT INTO `stok_obat` (`id_obat`, `nama_obat`, `stok`, `batas_notifikasi`, `tanggal_restok_terakhir`, `harga`) VALUES
(1, 'Paracetamol', 78, 50, '2026-07-04', 10000.00),
(2, 'Amoxicillin', 68, 30, '2026-07-04', 15000.00),
(3, 'Vitamin C', 120, 40, '2026-06-05', 8000.00),
(4, 'Ibuprofen', 87, 40, '2026-06-15', 20000.00),
(5, 'Antasida', 70, 30, '2026-06-12', 12000.00),
(6, 'test', 0, 50, '2026-07-04', 5000.00),
(7, 'betadine', 70, 50, '2026-07-04', 5000.00);

-- --------------------------------------------------------

--
-- Struktur dari tabel `tagihan`
--

CREATE TABLE `tagihan` (
  `id_tagihan` int(11) NOT NULL,
  `id_pasien` int(11) DEFAULT NULL,
  `total_biaya` decimal(10,2) DEFAULT NULL,
  `status` enum('lunas','belum') DEFAULT 'belum',
  `tanggal_tagihan` date DEFAULT NULL,
  `keterangan` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `tagihan`
--

INSERT INTO `tagihan` (`id_tagihan`, `id_pasien`, `total_biaya`, `status`, `tanggal_tagihan`, `keterangan`) VALUES
(1, 1, 170000.00, 'lunas', '2026-07-03', 'Tagihan otomatis untuk pasien ID 1'),
(2, 16, 165000.00, 'belum', '2026-07-03', 'Tagihan otomatis untuk pasien ID 16'),
(3, 3, 380000.00, 'belum', '2026-07-03', 'Tagihan rawat inap 2 hari di Reguler'),
(4, 2, 0.00, 'lunas', '2026-07-04', 'Tagihan rawat inap'),
(5, 4, 100000.00, 'lunas', '2026-07-04', 'Tagihan rawat inap'),
(6, 5, 520000.00, 'lunas', '2026-07-04', 'Tagihan otomatis untuk pasien ID 5'),
(7, 15, 665000.00, 'belum', '2026-07-04', 'Tagihan rawat inap 1 hari'),
(8, 6, 170000.00, 'lunas', '2026-07-04', 'Tagihan otomatis untuk pasien ID 6'),
(9, 20, 230000.00, 'lunas', '2026-07-04', 'Tagihan rawat inap 1 hari di Reguler');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `pwd` varchar(255) NOT NULL,
  `jabatan` enum('admin','akuntan','apoteker','dokter','pasien') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `pwd`, `jabatan`) VALUES
(1, 'admin1', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'admin'),
(2, 'dr. Budi', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'dokter'),
(3, 'akuntan1', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'akuntan'),
(4, 'apoteker1', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'apoteker'),
(5, 'dr. Sinta', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'dokter'),
(6, 'admin2', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'admin'),
(7, 'dr. Andi', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'dokter'),
(8, 'akuntan2', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'akuntan'),
(9, 'apoteker2', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'apoteker'),
(10, 'pasien1', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'pasien'),
(11, 'pasien2', '$2b$10$zYRSkjTl2jf03qcnkf9LQu1KYCTeAVFfnBRAr0ODSpeqvsnsJNo16', 'pasien'),
(13, 'admin4', '$2b$10$y7RBgdVlCL8XDzpgn5UwKu13NQHmXx4K55e0D.EUtu/a4j8h9eD4e', 'admin');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id_admin`);

--
-- Indeks untuk tabel `bayi`
--
ALTER TABLE `bayi`
  ADD PRIMARY KEY (`id_bayi`);

--
-- Indeks untuk tabel `check_up`
--
ALTER TABLE `check_up`
  ADD PRIMARY KEY (`id_checkup`),
  ADD KEY `id_pasien` (`id_pasien`),
  ADD KEY `id_dokter` (`id_dokter`),
  ADD KEY `fk_checkup_tagihan` (`id_tagihan`);

--
-- Indeks untuk tabel `dokter`
--
ALTER TABLE `dokter`
  ADD PRIMARY KEY (`id_dokter`);

--
-- Indeks untuk tabel `fasilitas`
--
ALTER TABLE `fasilitas`
  ADD PRIMARY KEY (`id_fasilitas`);

--
-- Indeks untuk tabel `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`id_notif`);

--
-- Indeks untuk tabel `pasien`
--
ALTER TABLE `pasien`
  ADD PRIMARY KEY (`id_pasien`);

--
-- Indeks untuk tabel `riwayat_obat`
--
ALTER TABLE `riwayat_obat`
  ADD PRIMARY KEY (`id_riwayat`),
  ADD KEY `id_pasien` (`id_pasien`),
  ADD KEY `id_obat` (`id_obat`),
  ADD KEY `fk_riwayat_tagihan` (`id_tagihan`);

--
-- Indeks untuk tabel `ruangan`
--
ALTER TABLE `ruangan`
  ADD PRIMARY KEY (`id_ruangan`),
  ADD KEY `ditempati` (`ditempati`),
  ADD KEY `fk_ruangan_tagihan` (`id_tagihan`);

--
-- Indeks untuk tabel `shift_staff`
--
ALTER TABLE `shift_staff`
  ADD PRIMARY KEY (`id_shift`),
  ADD KEY `id_staff` (`id_staff`);

--
-- Indeks untuk tabel `shift_users`
--
ALTER TABLE `shift_users`
  ADD PRIMARY KEY (`id_shift`),
  ADD KEY `id_users` (`id_users`);

--
-- Indeks untuk tabel `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id_staff`);

--
-- Indeks untuk tabel `stok_obat`
--
ALTER TABLE `stok_obat`
  ADD PRIMARY KEY (`id_obat`);

--
-- Indeks untuk tabel `tagihan`
--
ALTER TABLE `tagihan`
  ADD PRIMARY KEY (`id_tagihan`),
  ADD KEY `id_pasien` (`id_pasien`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `admin`
--
ALTER TABLE `admin`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `bayi`
--
ALTER TABLE `bayi`
  MODIFY `id_bayi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `check_up`
--
ALTER TABLE `check_up`
  MODIFY `id_checkup` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT untuk tabel `dokter`
--
ALTER TABLE `dokter`
  MODIFY `id_dokter` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `fasilitas`
--
ALTER TABLE `fasilitas`
  MODIFY `id_fasilitas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id_notif` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT untuk tabel `pasien`
--
ALTER TABLE `pasien`
  MODIFY `id_pasien` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT untuk tabel `riwayat_obat`
--
ALTER TABLE `riwayat_obat`
  MODIFY `id_riwayat` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `ruangan`
--
ALTER TABLE `ruangan`
  MODIFY `id_ruangan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `shift_staff`
--
ALTER TABLE `shift_staff`
  MODIFY `id_shift` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT untuk tabel `shift_users`
--
ALTER TABLE `shift_users`
  MODIFY `id_shift` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT untuk tabel `staff`
--
ALTER TABLE `staff`
  MODIFY `id_staff` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT untuk tabel `stok_obat`
--
ALTER TABLE `stok_obat`
  MODIFY `id_obat` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `tagihan`
--
ALTER TABLE `tagihan`
  MODIFY `id_tagihan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `check_up`
--
ALTER TABLE `check_up`
  ADD CONSTRAINT `fk_checkup_dokter` FOREIGN KEY (`id_dokter`) REFERENCES `dokter` (`id_dokter`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_checkup_pasien` FOREIGN KEY (`id_pasien`) REFERENCES `pasien` (`id_pasien`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_checkup_tagihan` FOREIGN KEY (`id_tagihan`) REFERENCES `tagihan` (`id_tagihan`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `riwayat_obat`
--
ALTER TABLE `riwayat_obat`
  ADD CONSTRAINT `fk_riwayat_obat` FOREIGN KEY (`id_obat`) REFERENCES `stok_obat` (`id_obat`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_pasien` FOREIGN KEY (`id_pasien`) REFERENCES `pasien` (`id_pasien`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_tagihan` FOREIGN KEY (`id_tagihan`) REFERENCES `tagihan` (`id_tagihan`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `ruangan`
--
ALTER TABLE `ruangan`
  ADD CONSTRAINT `fk_ruangan_pasien` FOREIGN KEY (`ditempati`) REFERENCES `pasien` (`id_pasien`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ruangan_tagihan` FOREIGN KEY (`id_tagihan`) REFERENCES `tagihan` (`id_tagihan`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `tagihan`
--
ALTER TABLE `tagihan`
  ADD CONSTRAINT `fk_tagihan_pasien` FOREIGN KEY (`id_pasien`) REFERENCES `pasien` (`id_pasien`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
