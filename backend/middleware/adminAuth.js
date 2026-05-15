const jwt = require('jsonwebtoken');

// Protects /api/admin/* routes — requires a token with role 'admin'.
function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token amministratore mancante.' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso riservato agli amministratori.' });
    }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessione amministratore scaduta.' });
    }
    return res.status(401).json({ error: 'Token non valido.' });
  }
}

module.exports = adminAuth;
