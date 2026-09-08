const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader) || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Session expired or unauthorized. Please log in again.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this', (err, admin) => {
    if (err) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    req.admin = admin;
    next();
  });
}

module.exports = authenticateToken;
