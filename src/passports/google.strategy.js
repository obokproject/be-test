const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");

module.exports = (pool) => {
  const authController = require("../controllers/authController")(pool);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
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
    console.log("Serializing user:", user);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    console.log("Deserializing user with ID:", id);
    try {
      const user = await authController.getUserById(id);
      console.log("User found:", user);
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });
};
