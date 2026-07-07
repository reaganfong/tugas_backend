module.exports = (roles = null) => {
    return (req, res, next) => {
        console.log('[AUTH] Checking session:', req.session);
        console.log('[AUTH] User:', req.session.user);
        
        if (roles === null) {
            return next();
        }

        if (!req.session.user) {
            return res.status(401).json({ message: 'Silakan login dulu' });
        }

        if (roles.length && !roles.includes(req.session.user.jabatan)) {
            return res.status(403).json({ message: 'Akses ditolak' });
        }

        next();
    };
};