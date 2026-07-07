const bcrypt = require('bcrypt');

async function generate() {
    const hash = await bcrypt.hash('admin', 10);

    console.log(`
INSERT INTO users (username,pwd,jabatan) VALUES
('admin1','${hash}','admin'),
('dr. Budi','${hash}','dokter'), 
('akuntan1','${hash}','akuntan'), 
('apoteker1','${hash}','apoteker'), 
('dr. Sinta','${hash}','dokter'), 
('admin2','${hash}','admin'), 
('dr. Andi','${hash}','dokter'), 
('akuntan2','${hash}','akuntan'), 
('apoteker2','${hash}','apoteker'),
('pasien1','${hash}','pasien'),
('pasien2','${hash}','pasien');
`);
}

generate();