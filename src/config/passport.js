const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const prisma = require('./prisma');

// JWT secret — fallback jika .env tidak set
const JWT_SECRET = process.env.JWT_SECRET || 'rumahsehat_jwt_secret_2024_super_secret';

const opts = {
  // Extract dari Authorization: Bearer <token>
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
};

passport.use(
  new JwtStrategy(opts, async (payload, done) => {
    try {
      // Verifikasi user masih ada di database
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!user) {
        return done(null, false);
      }

      // Attach user data ke req.user
      return done(null, {
        id: user.id,
        username: user.username,
        jabatan: user.jabatan,
        nama: payload.nama,
        profileId: payload.profileId || null,
      });
    } catch (error) {
      return done(error, false);
    }
  })
);

module.exports = { passport, JWT_SECRET };
