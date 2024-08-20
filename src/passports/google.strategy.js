const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");

module.exports = (pool) => {
  const authController = require("../controllers/authController")(pool);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/auth/google/callback",
      },
      async function (accessToken, refreshToken, profile, done) {
        try {
          const user = await authController.findOrCreateUser(profile);
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await authController.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
