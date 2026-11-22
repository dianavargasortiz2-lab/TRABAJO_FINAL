const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  const secret = process.env.JWT_SECRET;
  if (scheme !== 'Bearer' || !token || !secret) {
    return res.status(401).json({ message: 'Autenticación requerida.' });
  }
  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload !== 'object' || !payload.sub) {
      return res.status(401).json({ message: 'Sesión inválida.' });
    }
    req.adminId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'La sesión expiró. Inicia sesión nuevamente.' });
  }
}

module.exports = { requireAdmin };
