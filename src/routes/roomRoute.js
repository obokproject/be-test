// routes/roomRoute.js
const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const { isLoggedIn } = require("../middlewares"); // isLoggedIn 가져오기

/**
 * @swagger
 * /api/room:
 *   get:
 *     summary: "방 목록 가져오기"
 *     description: "로그인한 사용자가 참여할 수 있는 방 목록을 가져오는 API"
 *     responses:
 *       200:
 *         description: "성공적으로 방 목록을 반환"
 */
router.get("/", isLoggedIn, roomController.getRooms);

/**
 * @swagger
 * /api/room:
 *   post:
 *     summary: "새로운 방 생성"
 *     description: "새로운 방을 생성하는 API"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: "방 생성 성공"
 */
router.post("/", isLoggedIn, roomController.createRoom);

/**
 * @swagger
 * /api/room/{roomId}:
 *   get:
 *     summary: "특정 방의 정보 가져오기"
 *     description: "특정 방의 정보를 가져오는 API"
 *     parameters:
 *       - in: path
 *         name: roomId
 *         schema:
 *           type: string
 *         required: true
 *         description: "방의 ID"
 *     responses:
 *       200:
 *         description: "성공적으로 방 정보를 반환"
 */
router.get("/:roomId", isLoggedIn, roomController.getRoomInfo);

module.exports = router;
