const express = require("express");
const passport = require("passport");

module.exports = (pool) => {
  const router = express.Router();
  const authController = require("../controllers/authController")(pool);

  /**
   * @swagger
   * /api/auth/healthCheck:
   *   get:
   *     summary: "서버 상태 확인"
   *     description: "서버가 정상적으로 작동하는지 확인하는 헬스 체크 엔드포인트."
   *     responses:
   *       200:
   *         description: "서버 상태가 정상일 때 'Success!' 응답."
   */
  router.get("/healthCheck", (req, res) => {
    res.status(200).send("Success!");
  });

  /**
   * @swagger
   * /api/auth/google:
   *   get:
   *     summary: "Google OAuth 로그인"
   *     description: "Google OAuth를 통한 로그인 요청"
   *     responses:
   *       302:
   *         description: "Google OAuth로 리디렉션"
   */
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["email", "profile"] })
  );

  /**
   * @swagger
   * /api/auth/google/callback:
   *   get:
   *     summary: "Google OAuth 콜백"
   *     description: "Google OAuth 인증 후 콜백을 처리하는 엔드포인트."
   *     responses:
   *       302:
   *         description: "로그인 성공 또는 실패 후 리디렉션"
   */
  router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    authController.googleCallback
  );

  /**
   * @swagger
   * /api/auth/logout:
   *   get:
   *     summary: "사용자 로그아웃"
   *     description: "사용자를 로그아웃시키는 API"
   *     responses:
   *       200:
   *         description: "로그아웃 성공"
   */
  router.get("/logout", authController.logout);

  /**
   * @swagger
   * /api/auth/user:
   *   get:
   *     summary: "사용자 정보 가져오기"
   *     description: "현재 로그인된 사용자의 정보를 가져오는 엔드포인트."
   *     responses:
   *       200:
   *         description: "사용자 정보 반환"
   */
  router.get("/user", authController.getUser);

  /**
   * @swagger
   * /api/auth/update:
   *   put:
   *     summary: "사용자 정보 업데이트"
   *     description: "사용자의 정보를 업데이트하는 API."
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nickname:
   *                 type: string
   *               job:
   *                 type: string
   *     responses:
   *       200:
   *         description: "사용자 정보 업데이트 성공"
   */
  router.put("/update", authController.updateUser);

  /**
   * @swagger
   * /api/auth/room-history:
   *   get:
   *     summary: "사용자 방 활동 내역 조회"
   *     description: "현재 로그인된 사용자의 방 참여 기록을 가져오는 엔드포인트."
   *     responses:
   *       200:
   *         description: "사용자의 방 활동 내역 반환"
   */
  router.get("/room-history", authController.getUserRoomHistory);

  return router;
};
