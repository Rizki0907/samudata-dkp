const jwt = require('jsonwebtoken');

const loginAdmin = async (req, res) => {
  try {
    const { adminCode } = req.body;

    if (!adminCode) {
      return res.status(400).json({ success: false, message: 'Kode admin wajib diisi' });
    }

    let role = null;
    if (adminCode === process.env.ADMIN_CABANG_CODE) {
      role = 'admin_cabang';
    } else if (adminCode === process.env.ADMIN_PUSAT_CODE) {
      role = 'admin_pusat';
    }

    if (!role) {
      return res.status(401).json({ success: false, message: 'Kode admin salah' });
    }

    // Generate JWT
    const token = jwt.sign(
      { role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = { loginAdmin };
