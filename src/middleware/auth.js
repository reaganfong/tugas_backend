const passport = require('passport');

module.exports = (roles = null) => {
  return (req, res, next) => {
    // Public routes — no auth needed
    if (roles === null) {
      return next();
    }

    // Authenticated routes — verify JWT via Passport
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err) {
        console.error('[AUTH] Passport error:', err);
        return next(err);
      }

      if (!user) {
        console.log('[AUTH] Unauthorized — no valid token');
        return res.status(401).json({ message: 'Silakan login dulu' });
      }

      // Attach user data to request
      req.user = user;
      console.log('[AUTH] Authenticated:', user.username, '| Role:', user.jabatan);

      // Check role jika spesifik
      if (roles.length && !roles.includes(user.jabatan)) {
        console.log('[AUTH] Forbidden —', user.jabatan, 'not in', roles);
        return res.status(403).json({ message: 'Akses ditolak' });
      }

      console.log('[AUTH] Authorized ✅');
      next();
    })(req, res, next);
  };
};
