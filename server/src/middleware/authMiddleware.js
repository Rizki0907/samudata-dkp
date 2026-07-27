const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Tidak ada token akses. Akses ditolak.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kadaluarsa.' });
  }
};

const requireAdminPusat = (req, res, next) => {
  if (req.user?.role !== 'admin_pusat') {
    return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat mengakses fitur ini' });
  }
  next();
};

module.exports = { verifyToken, requireAdminPusat };
