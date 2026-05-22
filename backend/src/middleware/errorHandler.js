const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token invalide' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expiré' });
  }

  // Erreurs personnalisées avec statusCode
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Erreur interne du serveur';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
