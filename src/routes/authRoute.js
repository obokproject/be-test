const express = require("express");
const passport = require("passport");

module.exports = (pool) => {
  const router = express.Router();
  const authController = require("../controllers/authController")(pool);

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
  router.get("/auth/room-history", authController.getUserRoomHistory);

  return router;
};
