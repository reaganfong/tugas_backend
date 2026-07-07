/**
 * Sanitize helpers — konversi tipe data dari form input ke Prisma types
 *
 * Semua fungsi mengembalikan { value, error }:
 *   - value: hasil konversi (atau null untuk undef/empty)
 *   - error: null jika valid, string pesan error jika gagal
 *
 * Contoh:
 *   const { value: umur, error } = toInt(req.body.umur, 'umur');
 *   if (error) return res.status(400).json({ message: error });
 */

/**
 * Konversi ke Int (Prisma Int / Int?)
 */
function toInt(input, fieldName = 'Field') {
  if (input === undefined || input === null || input === '') {
    return { value: null, error: null };
  }

  const parsed = parseInt(String(input), 10);

  if (isNaN(parsed)) {
    return { value: null, error: `${fieldName} harus berupa angka bulat` };
  }

  return { value: parsed, error: null };
}

/**
 * Konversi ke Float (Prisma Float / Float?)
 */
function toFloat(input, fieldName = 'Field') {
  if (input === undefined || input === null || input === '') {
    return { value: null, error: null };
  }

  const parsed = parseFloat(String(input));

  if (isNaN(parsed)) {
    return { value: null, error: `${fieldName} harus berupa angka desimal` };
  }

  return { value: parsed, error: null };
}

/**
 * Konversi ke Boolean (Prisma Boolean / Boolean?)
 *
 * Menerima: true/false boolean, string "true"/"false"/"1"/"0", angka 1/0
 */
function toBool(input, fieldName = 'Field') {
  if (input === undefined || input === null || input === '') {
    return { value: null, error: null };
  }

  if (typeof input === 'boolean') {
    return { value: input, error: null };
  }

  const str = String(input).toLowerCase().trim();

  if (str === 'true' || str === '1') {
    return { value: true, error: null };
  }

  if (str === 'false' || str === '0') {
    return { value: false, error: null };
  }

  return { value: null, error: `${fieldName} harus berupa true/false atau 1/0` };
}

module.exports = { toInt, toFloat, toBool };
