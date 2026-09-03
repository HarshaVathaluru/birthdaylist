const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this', (err, admin) => {
    if (err) return res.sendStatus(401);
    req.admin = admin;
    next();
  });
}

module.exports = authenticateToken;
