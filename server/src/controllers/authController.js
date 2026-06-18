const jwt = require('jsonwebtoken');

const loginAdmin = async (req, res) => {
  try {
    const { adminCode } = req.body;

    if (!adminCode) {
      return res.status(400).json({ success: false, message: 'Kode admin wajib diisi' });
    }

    if (adminCode !== process.env.ADMIN_CODE) {
      return res.status(401).json({ success: false, message: 'Kode admin salah' });
    }

    // Generate JWT
    const token = jwt.sign(
      { role: 'admin' },
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
