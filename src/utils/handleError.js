/**
 * Error handler — membedakan Prisma error dari error biasa
 * dan mengembalikan status code + pesan yang sesuai.
 *
 * Prisma error codes:
 *   P2025 → 404 (record not found / depend not found)
 *   P2002 → 409 (unique constraint violation — data sudah ada)
 *   P2003 → 400 (foreign key constraint — data terkait tidak ditemukan)
 *   P2014 → 400 (required relation violation — referensi tidak valid)
 *   P2016 → 400 (query interpretation error — data tidak valid)
 *   Lainnya → 500 (internal server error)
 *
 * Non-Prisma error → 500 (internal server error)
 *
 * Usage:
 *   try { ... } catch (err) { handleError(res, err, 'Gagal memuat data'); }
 *
 * @param {object} res - Express response object
 * @param {Error} err - Error object (bisa Prisma atau biasa)
 * @param {string} defaultMessage - Pesan default untuk error 500
 */
function handleError(res, err, defaultMessage = 'Server error') {
  // Selalu log error di server
  console.error(`[ERROR] ${defaultMessage}:`, err);

  // Deteksi Prisma error
  if (err && err.code && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2025':
        // Record not found — misal findUniqueOrThrow, update/delete di record ga ada
        return res.status(404).json({ message: 'Data tidak ditemukan' });

      case 'P2002':
        // Unique constraint — misal duplikat username
        return res.status(409).json({ message: 'Data sudah ada' });

      case 'P2003':
        // Foreign key constraint — misal referensi ke record yang ga ada
        return res.status(400).json({ message: 'Data terkait tidak ditemukan' });

      case 'P2014':
        // Required relation violation — misal null di field required relation
        return res.status(400).json({ message: 'Referensi data tidak valid' });

      case 'P2016':
        // Query interpretation error — misal type mismatch di query
        return res.status(400).json({ message: 'Data yang dikirim tidak valid' });

      case 'P2023':
        // Inconsistent data — misal ObjectId format salah
        return res.status(400).json({ message: 'ID tidak valid' });

      default:
        // Prisma error lain yang tidak dikenal — jangan expose detail ke client
        return res.status(500).json({ message: 'Server error' });
    }
  }

  // Non-Prisma error — default 500
  return res.status(500).json({ message: defaultMessage });
}

module.exports = { handleError };
