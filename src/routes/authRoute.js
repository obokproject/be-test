const express = require("express");
const passport = require("passport");

module.exports = (pool) => {
  const router = express.Router();
  const authController = require("../controllers/authController")(pool);

  // /api/auth/healthCheck
  router.get("/healthCheck", (req, res) => {
    res.status(200).send("Success!");
  });

  router.get(
    "/google",
    passport.authenticate("google", { scope: ["email", "profile"] })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    authController.googleCallback
  );

  router.get("/logout", authController.logout);

  router.get("/user", authController.getUser);

  //mypage수정했을때
  router.delete("/profile-image", authController.deleteImage);
  router.put("/update", authController.updateUser);
  //mypage 활동내역
  router.get("/room-history", authController.getUserRoomHistory);

  return router;
};
