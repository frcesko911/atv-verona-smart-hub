const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  console.log("AUTH HEADER:", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token di autenticazione mancante.' });
  }

  const token = authHeader.split(' ')[1];

  console.log("TOKEN:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED:", decoded);

    req.userId = decoded.userId;

    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessione scaduta. Effettua nuovamente il login.' });
    }

    return res.status(401).json({ error: 'Token non valido.' });
  }
}

module.exports = authMiddleware;