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
        console.time("Google login process"); //여기
        try {
          const user = await authController.findOrCreateUser(profile);
          console.timeEnd("Google login process"); //여기

          return done(null, user);
        } catch (error) {
          console.timeEnd("Google login process"); //여기

          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.time("Serialize user"); //이거
    console.log("Serializing user:", user);
    done(null, user.id);
    console.timeEnd("Serialize user"); //이거
  });

  passport.deserializeUser(async (id, done) => {
    console.time("Deserialize user"); //이거
    console.log("Deserializing user with ID:", id);
    try {
      const user = await authController.getUserById(id);
      console.log("User deserialized:", user); //이거
      console.log("User found:", user);
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
      console.timeEnd("Deserialize user"); //이거
    }
  });
};
